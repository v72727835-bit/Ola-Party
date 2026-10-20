import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Easing, Image, useWindowDimensions, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { connectAudio, AudioConnection } from './audio';

type Item = Record<string, any>;
type Icon = React.ComponentProps<typeof Ionicons>['name'];
type MIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const API = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

const c = {
  ink: '#16112B', text: '#3A3550', muted: '#6F6A85', faint: '#9893AD', bg: '#F5F4F9', card: '#FFFFFF', line: '#ECEAF3',
  brand: '#FF2E74', violet: '#7C3AED', mango: '#FF9F1C', teal: '#00B89C', blue: '#3D7BFF', gold: '#FFC23C', red: '#E5484D', male: '#3D8BFF', female: '#FF4F9A',
};
const brand: [string, string] = ['#FF2E74', '#8B3DFF'];
const warm: [string, string] = ['#FFB21C', '#FF2E74'];
const tagColors: Record<string, [string, string]> = { Chat: ['#00B89C', '#0EA5E9'], Music: ['#FF2E74', '#FF7A45'], Friends: ['#8B3DFF', '#C04BFF'], Gaming: ['#FF9F1C', '#F25C05'], Chill: ['#3D7BFF', '#6366F1'] };
const giftLook: Record<string, { icon: MIcon; colors: [string, string] }> = {
  rose: { icon: 'flower-tulip', colors: ['#FF5C8A', '#E11D48'] }, heart: { icon: 'heart', colors: ['#FF4FA3', '#C026D3'] },
  crown: { icon: 'crown', colors: ['#FFD54A', '#F59E0B'] }, rocket: { icon: 'rocket-launch', colors: ['#60A5FA', '#7C3AED'] },
};
const decoLook: Record<string, MIcon> = { frame: 'circle-double', entrance: 'rocket-launch-outline', badge: 'star-circle' };
const hash = (s = '') => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
const initials = (s?: string) => (s || 'P').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
const firstName = (s?: string) => (s || 'friend').split(' ')[0];
const shortId = (id?: string) => String(1000000000 + (hash(id) % 8999999999)).slice(0, 10);
const ago = (iso?: string) => { if (!iso) return ''; const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000)); if (m < 1) return 'now'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`; const d = Math.round(h / 24); return d === 1 ? 'Yesterday' : `${d} days ago`; };
const when = (iso?: string) => { if (!iso) return 'Date coming soon'; const d = new Date(iso); return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };
const fallbackTints: [string, string][] = [['#FFB199', '#FF0844'], ['#A18CD1', '#7C3AED'], ['#84FAB0', '#0EA5E9'], ['#FCCB90', '#D57EEB'], ['#5EE7DF', '#3D7BFF'], ['#F6D365', '#FDA085']];

const API_HOST = API.replace(/\/api$/, '');
const frameColors = (equipped?: Item): [string, string] | null => equipped?.frame === 'frame-aurora' ? ['#5EF2C6', '#8B3DFF'] : equipped?.frame === 'frame-spark' ? ['#FFE08A', '#FF9F1C'] : null;
const THEMES: Record<string, { name: string; colors: [string, string, string] }> = {
  galaxy: { name: 'Galaxy', colors: ['#2B0A55', '#1A0B3B', '#0E0726'] }, sunset: { name: 'Sunset', colors: ['#5A1236', '#3A0D2E', '#1B0716'] },
  ocean: { name: 'Ocean', colors: ['#06345A', '#0A2342', '#04121F'] }, forest: { name: 'Forest', colors: ['#0B4030', '#082C22', '#041611'] },
  royal: { name: 'Royal', colors: ['#4A2A06', '#2E1A08', '#140B03'] }, midnight: { name: 'Midnight', colors: ['#1B2236', '#11162A', '#070A14'] },
};
const ZODIAC: [number, string][] = [[120, 'Capricorn'], [219, 'Aquarius'], [320, 'Pisces'], [420, 'Aries'], [521, 'Taurus'], [621, 'Gemini'], [722, 'Cancer'], [823, 'Leo'], [923, 'Virgo'], [1023, 'Libra'], [1122, 'Scorpio'], [1222, 'Sagittarius'], [1231, 'Capricorn']];
const zodiac = (d?: string) => { const m = d?.match(/^\d{4}-(\d{2})-(\d{2})$/); if (!m) return ''; const v = Number(m[1]) * 100 + Number(m[2]); return (ZODIAC.find(([end]) => v <= end) || ZODIAC[0])[1]; };
const UNO_COL: Record<string, string> = { red: '#E5484D', yellow: '#F2B705', green: '#1FA35B', blue: '#2D7FF9', wild: '#1D1238' };
function UnoCard({ card, w = 58, lifted = false, dim = false }: { card?: Item; w?: number; lifted?: boolean; dim?: boolean }) {
  const h = w * 1.45; if (!card) return <LinearGradient colors={['#1D1238', '#3B1E7A']} style={{ width: w, height: h, borderRadius: w * .16, borderWidth: 2.5, borderColor: 'white', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFD54A', fontWeight: '900', fontSize: w * .3, transform: [{ rotate: '-20deg' }] }}>UNO</Text></LinearGradient>;
  const label = card.value === 'draw2' ? '+2' : card.value === 'wild4' ? '+4' : card.value === 'skip' ? null : card.value === 'reverse' ? null : card.value === 'wild' ? null : card.value;
  const icon: MIcon | null = card.value === 'skip' ? 'cancel' : card.value === 'reverse' ? 'swap-horizontal' : card.value === 'wild' ? 'palette' : null;
  return <View style={{ width: w, height: h, borderRadius: w * .16, backgroundColor: UNO_COL[card.color], borderWidth: 2.5, borderColor: 'white', alignItems: 'center', justifyContent: 'center', opacity: dim ? .55 : 1, transform: [{ translateY: lifted ? -10 : 0 }], ...Platform.select({ web: { boxShadow: '0 3px 8px rgba(0,0,0,.25)' } as any, default: { elevation: 3 } }) }}>
    <View style={{ position: 'absolute', width: w * .78, height: h * .62, borderRadius: w, backgroundColor: '#FFFFFF2E', transform: [{ rotate: '25deg' }] }} />
    {card.color === 'wild' && <View style={{ position: 'absolute', width: w * .62, height: w * .62, flexDirection: 'row', flexWrap: 'wrap', borderRadius: w, overflow: 'hidden', transform: [{ rotate: '25deg' }] }}>{['red', 'blue', 'yellow', 'green'].map(cc => <View key={cc} style={{ width: '50%', height: '50%', backgroundColor: UNO_COL[cc] }} />)}</View>}
    {label ? <Text style={{ color: 'white', fontSize: w * .42, fontWeight: '900', textShadowColor: '#0006', textShadowRadius: 3 }}>{label}</Text> : icon ? <MaterialCommunityIcons name={icon} size={w * .45} color="white" /> : null}
  </View>;
}
function GiftBurst({ burst }: { burst: Item | null }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { if (!burst) return; v.setValue(0); Animated.timing(v, { toValue: 1, duration: 2200, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start(); }, [burst?.key]);
  if (!burst) return null;
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '28%', alignItems: 'center', opacity: v.interpolate({ inputRange: [0, .1, .8, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [140, -60] }) }, { scale: v.interpolate({ inputRange: [0, .25, 1], outputRange: [.3, 1.25, 1] }) }] }}>
    <View style={{ width: 230, height: 230, borderRadius: 115, backgroundColor: '#FFD54A33', alignItems: 'center', justifyContent: 'center' }}><GiftArt id={burst.giftId} size={150} /></View>
    <Text style={{ color: '#FFE08A', fontSize: 34, fontWeight: '900', fontStyle: 'italic', marginTop: 8, textShadowColor: '#000A', textShadowRadius: 6 }}>{burst.from?.name ? firstName(burst.from.name) : ''} x{burst.qty}</Text>
  </Animated.View>;
}

function Photo({ uri, name, size = 46, radius, ring, ringColors = warm }: { uri?: string; name?: string; size?: number; radius?: number; ring?: boolean; ringColors?: [string, string] }) {
  const [failed, setFailed] = useState(false);
  if (uri && uri.startsWith('/')) uri = API_HOST + uri;
  const r = radius ?? size / 2;
  const inner = uri && !failed
    ? <Image source={{ uri }} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: r, backgroundColor: '#E9E6F2' }} />
    : <LinearGradient colors={fallbackTints[hash(name) % fallbackTints.length]} style={{ width: size, height: size, borderRadius: r, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontWeight: '800', fontSize: size * .36 }}>{initials(name)}</Text></LinearGradient>;
  return ring ? <LinearGradient colors={ringColors} style={{ padding: 2.5, borderRadius: r + 3 }}><View style={{ padding: 2, borderRadius: r + 2, backgroundColor: 'white' }}>{inner}</View></LinearGradient> : inner;
}
function Level({ level = 1, gender }: { level?: number; gender?: string }) {
  const col: [string, string] = gender === 'female' ? ['#FF7AB6', '#FF2E74'] : gender === 'male' ? ['#6AB0FF', '#3D7BFF'] : ['#B99BFF', '#7C3AED'];
  return <LinearGradient colors={col} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.level}>{gender && <Ionicons name={gender === 'female' ? 'female' : 'male'} size={11} color="white" />}<Text style={s.levelText}>{level}</Text></LinearGradient>;
}
function Coin({ n, size = 15, dark = false }: { n: number | string; size?: number; dark?: boolean }) { return <View style={s.inline}><MaterialCommunityIcons name="circle-multiple" size={size} color={c.gold} /><Text style={[s.coinTxt, { fontSize: size, color: dark ? 'white' : c.ink }]}>{n}</Text></View>; }
function Diamond({ n, size = 15, dark = false }: { n: number | string; size?: number; dark?: boolean }) { return <View style={s.inline}><MaterialCommunityIcons name="diamond-stone" size={size} color="#38BDF8" /><Text style={[s.coinTxt, { fontSize: size, color: dark ? 'white' : c.ink }]}>{n}</Text></View>; }
function GiftArt({ id, size = 64 }: { id: string; size?: number }) { const g = giftLook[id] || giftLook.heart; return <LinearGradient colors={g.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={g.icon} size={size * .55} color="white" /></LinearGradient>; }
function Button({ title, onPress, soft = false, disabled = false, small = false, dark = false }: { title: string; onPress: () => void; soft?: boolean; disabled?: boolean; small?: boolean; dark?: boolean }) {
  const label = <Text style={[s.buttonText, small && { fontSize: 14.5 }, soft && { color: dark ? 'white' : c.brand }]}>{title}</Text>;
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [{ opacity: disabled ? .45 : pressed ? .85 : 1 }]}>
    {soft ? <View style={[s.button, small && s.buttonSmall, { backgroundColor: dark ? '#FFFFFF1F' : '#FFE8F0' }]}>{label}</View> : <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.button, small && s.buttonSmall]}>{label}</LinearGradient>}
  </Pressable>;
}
function Field({ label, value, onChangeText, secure = false, multiline = false, placeholder = '' }: { label: string; value: string; onChangeText: (v: string) => void; secure?: boolean; multiline?: boolean; placeholder?: string }) {
  return <View style={{ gap: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} secureTextEntry={secure} multiline={multiline} placeholder={placeholder} placeholderTextColor={c.faint} style={[s.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]} autoCapitalize={label.toLowerCase().includes('email') ? 'none' : 'sentences'} /></View>;
}
function Heading({ title, note, action, actionLabel = 'Refresh' }: { title: string; note?: string; action?: () => void; actionLabel?: string }) {
  return <View style={s.sectionHead}><View style={{ flex: 1 }}><Text style={s.sectionTitle}>{title}</Text>{note && <Text style={s.small}>{note}</Text>}</View>{action && <Pressable accessibilityRole="button" onPress={action}><Text style={s.link}>{actionLabel}</Text></Pressable>}</View>;
}
function Empty({ title, note }: { title: string; note: string }) { return <View style={s.empty}><Text style={s.cardTitle}>{title}</Text><Text style={[s.small, { textAlign: 'center' }]}>{note}</Text></View>; }
function Tabs({ items, value, onChange, big = false }: { items: string[]; value: string; onChange: (v: string) => void; big?: boolean }) {
  return <View style={[s.row, { gap: 20 }]}>{items.map(t => <Pressable key={t} onPress={() => onChange(t)} style={{ alignItems: 'center', gap: 5 }}><Text style={[big ? s.tabBig : s.tab, value === t && (big ? s.tabBigOn : s.tabOn)]}>{t}</Text><View style={[s.tabLine, value !== t && { backgroundColor: 'transparent' }]} /></Pressable>)}</View>;
}
function SpeakRing({ active, size }: { active: boolean; size: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { if (!active) { v.stopAnimation(); v.setValue(0); return; } const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' })); loop.start(); return () => loop.stop(); }, [active]);
  if (!active) return null;
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: '#5EF2C6', opacity: v.interpolate({ inputRange: [0, 1], outputRange: [.9, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] }} />;
}


// ---------- Ludo board ----------
const LUDO: Record<string, string> = { red: '#E5484D', green: '#1FA35B', yellow: '#F2B705', blue: '#2D7FF9' };
const LUDO_SOFT: Record<string, string> = { red: '#FDE2E3', green: '#DDF5E7', yellow: '#FFF3C4', blue: '#DDEBFF' };
const L_OFFSET: Record<string, number> = { red: 0, green: 13, yellow: 26, blue: 39 };
const L_SAFE = [0, 8, 13, 21, 26, 34, 39, 47];
const L_TRACK: [number, number][] = [[6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]];
const L_HOMECOL: Record<string, [number, number][]> = { red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]], green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]], yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]], blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]] };
const L_YARD: Record<string, [number, number]> = { red: [0, 0], green: [0, 9], yellow: [9, 9], blue: [9, 0] };
const L_FINISH: Record<string, [number, number]> = { red: [7, 6.3], green: [6.3, 7], yellow: [7, 7.7], blue: [7.7, 7] };
const ludoLegal = (g: Item, id: string, dice: number) => ((g.tokens?.[id] || []) as number[]).map((p, i) => ((p === -1 && dice === 6) || (p >= 0 && p + dice <= 56) ? i : -1)).filter(i => i >= 0);
const ludoCell = (color: string, pos: number, i: number): [number, number] => {
  if (pos === -1) { const [r, cc] = L_YARD[color]; return [r + 1.5 + (i >= 2 ? 2 : 0), cc + 1.5 + (i % 2 ? 2 : 0)]; }
  if (pos <= 50) return L_TRACK[(pos + L_OFFSET[color]) % 52];
  if (pos <= 55) return L_HOMECOL[color][pos - 51];
  return L_FINISH[color];
};

function Dice({ value, rolling, size = 64 }: { value?: number | null; rolling?: boolean; size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => { spin.setValue(0); Animated.timing(spin, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start(); }, [value, rolling]);
  const pips: Record<number, [number, number][]> = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [0, 2], [2, 0], [2, 2]], 5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]], 6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]] };
  const d = size * .16; const pad = size * .17; const step = (size - pad * 2 - d) / 2;
  return <Animated.View style={{ width: size, height: size, borderRadius: size * .22, backgroundColor: 'white', borderWidth: 2, borderColor: '#E4E0EE', transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) }, { scale: spin.interpolate({ inputRange: [0, .5, 1], outputRange: [.8, 1.12, 1] }) }] }}>
    {(pips[value || 0] || []).map(([r, cc], k) => <View key={k} style={{ position: 'absolute', width: d, height: d, borderRadius: d / 2, backgroundColor: value === 6 || value === 1 ? '#E5484D' : '#1D1238', top: pad + r * step, left: pad + cc * step }} />)}
    {!value && <Text style={{ position: 'absolute', alignSelf: 'center', top: size * .3, fontSize: size * .26, fontWeight: '900', color: '#9893AD' }}>?</Text>}
  </Animated.View>;
}

function LudoBoard({ g, me, size, onToken }: { g: Item; me?: string; size: number; onToken: (i: number) => void }) {
  const cell = size / 15; const at = (r: number, cc: number) => ({ position: 'absolute' as const, top: r * cell, left: cc * cell, width: cell, height: cell });
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' }), Animated.timing(pulse, { toValue: 0, duration: 500, useNativeDriver: Platform.OS !== 'web' })])); loop.start(); return () => loop.stop(); }, []);
  const active = new Set(Object.values(g.colors || {}) as string[]);
  const movable = g.status === 'playing' && g.turn === me && g.phase === 'move' ? ludoLegal(g, me!, g.dice) : [];
  const tokens: { id: string; color: string; i: number; pos: number }[] = []; for (const id of g.playerIds || []) (g.tokens?.[id] || []).forEach((pos: number, i: number) => tokens.push({ id, color: g.colors[id], i, pos }));
  const stack: Record<string, number> = {};
  const c3 = cell * 1.5;
  return <View style={{ width: size, height: size, backgroundColor: 'white', borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#2A1660' }}>
    {(['red', 'green', 'yellow', 'blue'] as const).map(col => { const [r, cc] = L_YARD[col]; return <View key={col} style={{ position: 'absolute', top: r * cell, left: cc * cell, width: cell * 6, height: cell * 6, backgroundColor: LUDO[col], opacity: active.size && !active.has(col) ? .35 : 1, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: cell * 4.2, height: cell * 4.2, borderRadius: cell, backgroundColor: 'white' }}>{[0, 1, 2, 3].map(i => <View key={i} style={{ position: 'absolute', width: cell * 1.1, height: cell * 1.1, borderRadius: cell, backgroundColor: LUDO_SOFT[col], borderWidth: 1.5, borderColor: LUDO[col], top: cell * (0.45 + (i >= 2 ? 2 : 0)) + cell * .05, left: cell * (0.45 + (i % 2 ? 2 : 0)) + cell * .05 }} />)}</View></View>; })}
    {L_TRACK.map(([r, cc], k) => { const startCol = Object.keys(L_OFFSET).find(col => L_OFFSET[col] === k); return <View key={'t' + k} style={[at(r, cc), { borderWidth: .5, borderColor: '#CFC8DD', backgroundColor: startCol ? LUDO[startCol] : 'white', alignItems: 'center', justifyContent: 'center' }]}>{L_SAFE.includes(k) && !startCol && <MaterialCommunityIcons name="star" size={cell * .7} color="#B5ACC9" />}</View>; })}
    {Object.entries(L_HOMECOL).map(([col, cells]) => cells.map(([r, cc], k) => <View key={col + k} style={[at(r, cc), { borderWidth: .5, borderColor: '#CFC8DD', backgroundColor: LUDO[col] }]} />))}
    <View style={{ position: 'absolute', top: 6 * cell, left: 6 * cell, width: 3 * cell, height: 3 * cell }}>
      <View style={{ position: 'absolute', top: 0, left: 0, borderTopWidth: c3, borderBottomWidth: c3, borderLeftWidth: c3, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: LUDO.red }} />
      <View style={{ position: 'absolute', top: 0, left: 0, borderLeftWidth: c3, borderRightWidth: c3, borderTopWidth: c3, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: LUDO.green }} />
      <View style={{ position: 'absolute', top: 0, right: 0, borderTopWidth: c3, borderBottomWidth: c3, borderRightWidth: c3, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: LUDO.yellow }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, borderLeftWidth: c3, borderRightWidth: c3, borderBottomWidth: c3, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: LUDO.blue }} />
    </View>
    {tokens.map(t => { const [r, cc] = ludoCell(t.color, t.pos, t.i); const key = `${r},${cc}`; const n = t.pos === -1 ? 0 : (stack[key] = (stack[key] ?? -1) + 1); const can = t.id === me && movable.includes(t.i); const sz = cell * (t.pos === -1 ? 1 : .82); const off = n * cell * .18;
      return <Pressable key={t.id + t.i} accessibilityLabel={`${t.color} token ${t.i + 1}`} disabled={!can} onPress={() => onToken(t.i)} style={{ position: 'absolute', top: r * cell + (cell - sz) / 2 - off + (t.pos === -1 ? cell * .05 : 0), left: cc * cell + (cell - sz) / 2 + off + (t.pos === -1 ? cell * .05 : 0), width: sz, height: sz, zIndex: can ? 20 : 10 + n }}>
        {can && <Animated.View style={{ position: 'absolute', left: -4, top: -4, right: -4, bottom: -4, borderRadius: sz, borderWidth: 3, borderColor: '#1D1238', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [.35, 1] }) }} />}
        <View style={{ flex: 1, borderRadius: sz / 2, backgroundColor: LUDO[t.color], borderWidth: 2.5, borderColor: 'white', alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0 2px 4px rgba(0,0,0,.35)' } as any, default: { elevation: 3 } }) }}><View style={{ width: sz * .32, height: sz * .32, borderRadius: sz, backgroundColor: '#FFFFFFB3' }} /></View>
      </Pressable>; })}
  </View>;
}

export default function App() { return <SafeAreaProvider><PartyApp /></SafeAreaProvider>; }

function PartyApp() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [token, setToken] = useState(''); const [user, setUser] = useState<Item | null>(null); const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState('Party'); const [page, setPage] = useState(''); const [rooms, setRooms] = useState<Item[]>([]); const [posts, setPosts] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<Record<string, Item[]>>({}); const [room, setRoom] = useState<Item | null>(null); const [messages, setMessages] = useState<Item[]>([]);
  const [dm, setDm] = useState<Item | null>(null); const [conversations, setConversations] = useState<Item[]>([]); const [wallet, setWallet] = useState<Item | null>(null);
  const [q, setQ] = useState(''); const [category, setCategory] = useState('All'); const [notice, setNotice] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false); const [retry, setRetry] = useState(0); const socket = useRef<Socket | null>(null);
  const [newPassword, setNewPassword] = useState(''); const [phone, setPhone] = useState(''); const [otp, setOtp] = useState(''); const [usePhone, setUsePhone] = useState(false); const [bags, setBags] = useState<Item[]>([]); const [bagTotal, setBagTotal] = useState('100'); const [bagCount, setBagCount] = useState('5'); const [queue, setQueue] = useState<Item[]>([]); const [deleteArmed, setDeleteArmed] = useState(false); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [register, setRegister] = useState(false);
  const [text, setText] = useState(''); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [formCategory, setFormCategory] = useState('Chill');
  const [selectedGift, setSelectedGift] = useState<Item | null>(null); const [recipient, setRecipient] = useState(''); const [profile, setProfile] = useState<Item | null>(null); const [comments, setComments] = useState<Item[]>([]); const [post, setPost] = useState<Item | null>(null);
  const audioRef = useRef<AudioConnection | null>(null); const [audioConnected, setAudioConnected] = useState(false); const [micOn, setMicOn] = useState(false);
  const [game, setGame] = useState<Item | null>(null); const [battle, setBattle] = useState<Item | null>(null);
  const [pendingRoom, setPendingRoom] = useState<Item | null>(null); const [giftEvent, setGiftEvent] = useState<Item | null>(null); const [entrance, setEntrance] = useState<Item | null>(null); const [notifs, setNotifs] = useState<Item[]>([]); const [notifUnread, setNotifUnread] = useState(0);
  const activeChat = useRef<{ page: string; roomId?: string; peerId?: string; userId?: string }>({ page: '' });
  const giftKeyRef = useRef<{ intent: string; key: string } | null>(null);
  const giftRequestKey = (giftId: string, recipientId: string, roomId?: string) => { const intent = JSON.stringify([giftId, recipientId, roomId]); if (giftKeyRef.current?.intent !== intent) giftKeyRef.current = { intent, key: `gift-${Date.now()}-${Math.random().toString(36).slice(2)}` }; return giftKeyRef.current.key; };
  activeChat.current = { page, roomId: room?.id, peerId: dm?.id, userId: user?.id };
  const stopAudio = async () => { const audio = audioRef.current; audioRef.current = null; setAudioConnected(false); setMicOn(false); if (audio) await audio.disconnect(); };

  const api = useCallback(async (path: string, method = 'GET', body?: Item, auth = token) => {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
    try { const res = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal });
      const json = await res.json(); if (!res.ok) { if (res.status === 401 && auth) { await AsyncStorage.removeItem('melo-session'); socket.current?.disconnect(); setToken(''); setUser(null); setRoom(null); setDm(null); setMessages([]); setPage(''); setNotice('Session khatam ho gaya. Please dobara sign in karo.'); } throw new Error(json.error?.message || `Request failed (${res.status})`); } return json.data;
    } catch (e: any) { if (e.name === 'AbortError' || e.message === 'Failed to fetch' || e.message === 'Network request failed') throw new Error('Server se connect nahi ho paya. Internet check karo aur dobara try karo — server jaagne mein kabhi 50 second lagte hain.'); throw e; } finally { clearTimeout(timeout); }
  }, [token]);
  const act = async (fn: () => Promise<void>) => { if (busy) return; setBusy(true); setError(''); try { await fn(); } catch (e: any) { setError(e.message); } finally { setBusy(false); } };
  const refresh = useCallback(async () => { if (!token) return; setLoading(true); setError(''); try { const results = await Promise.allSettled([api('/rooms'), api('/posts'), api('/me'), api('/conversations')]); const [r, p, me, c] = results; if (r.status === 'fulfilled') setRooms(r.value); if (p.status === 'fulfilled') setPosts(p.value); if (me.status === 'fulfilled') setUser(me.value); if (c.status === 'fulfilled') setConversations(c.value); const failed = results.find(x => x.status === 'rejected') as PromiseRejectedResult | undefined; if (failed) setError(failed.reason?.message || 'Kuch cheezein load nahi hui. Refresh dabao.'); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [api, token]);
  useEffect(() => { AsyncStorage.getItem('melo-session').then(v => { if (v) { try { const data = JSON.parse(v); setToken(data.token); setUser(data.user); } catch {} } }).finally(() => setHydrated(true)); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (!token) return; const client = io(API.replace(/\/api$/, ''), { auth: { token }, reconnectionAttempts: Infinity, reconnectionDelayMax: 10000 }); socket.current = client;
    client.on('connect', () => setConnected(true)); client.on('disconnect', () => setConnected(false)); client.on('connect_error', () => setConnected(false));
    client.on('room:updated', (r: Item) => { setRooms(prev => prev.map(x => x.id === r.id ? r : x)); setRoom(prev => prev?.id === r.id ? r : prev); });
    const add = (m: Item) => { const active = activeChat.current; const belongs = m.roomId ? active.page === 'room' && m.roomId === active.roomId : active.page === 'dm' && ((m.fromId === active.peerId && m.toId === active.userId) || (m.fromId === active.userId && m.toId === active.peerId)); if (belongs) setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]); };
    client.on('room:message', add); client.on('dm:message', (m: Item) => { add(m); api('/conversations').then(setConversations).catch(() => {}); });
    client.on('wallet:updated', (w: Item) => { setUser(prev => prev ? { ...prev, ...w } : prev); setWallet(prev => prev ? { ...prev, ...w } : prev); });
    client.on('gift:sent', (t: Item) => setGiftEvent({ ...t, key: `${t.id}-${Date.now()}` })); client.on('room:queue', (q: Item[]) => setQueue(q)); client.on('room:lucky-bag', () => setNotice('Lucky bag aaya hai! Jaldi grab karo.'));
    client.on('game:updated', (g: Item) => setGame(prev => prev?.id === g.id ? g : prev)); client.on('notification', (n: Item) => { setNotifUnread(x => x + 1); if (n.type !== 'visit') setNotice(n.text); }); client.on('room:entrance', (e: Item) => setEntrance({ ...e, key: `${e.user?.id}-${Date.now()}` }));
    client.on('pk:updated', () => setNotice('PK battle update hua. Score dekho.'));
    return () => { client.disconnect(); socket.current = null; };
  }, [token, retry]);
  useEffect(() => { if (room && connected) socket.current?.emit('room:subscribe', room.id); }, [room?.id, connected]);
  const currentSeat = room?.seats?.find((seat: Item) => seat.userId === user?.id);
  useEffect(() => { if (!audioRef.current) return; stopAudio().catch(() => {}); }, [room?.id, currentSeat?.index, currentSeat?.muted, room?.members?.includes(user?.id)]);
  useEffect(() => () => { audioRef.current?.disconnect().catch(() => {}); }, []);
  useEffect(() => { if (!token) stopAudio().catch(() => {}); }, [token]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(t); }, [notice]);

  const authenticate = (demo = false) => act(async () => { const data = await api(demo ? '/auth/demo' : register ? '/auth/register' : '/auth/login', 'POST', demo ? {} : { email, password, name }); await AsyncStorage.setItem('melo-session', JSON.stringify(data)); setUser(data.user); setToken(data.token); setPassword(''); });
  const navigate = (p: string) => { setPage(p); setText(''); setError(''); };
  const loadCatalog = (p: string) => act(async () => { const key = p === 'leaderboard' ? 'rankings' : p; const data = await api('/' + key); setCatalog(prev => ({ ...prev, [p]: Array.isArray(data) ? data : data?.items || data?.plans || [] })); navigate(p); });
  const openWallet = () => act(async () => { setWallet(await api('/wallet')); navigate('wallet'); });
  const enterRoom = (r: Item, roomPassword?: string) => act(async () => { if (r.locked && r.ownerId !== user?.id && roomPassword === undefined) { setPendingRoom(r); setPassword(''); navigate('join-locked'); return; } await api(`/rooms/${r.id}/join`, 'POST', { password: roomPassword }); if (room && room.id !== r.id) { await api(`/rooms/${room.id}/leave`, 'POST', {}); await stopAudio(); } const current = await api(`/rooms/${r.id}`); setRoom(current); setDm(null); setMessages(await api(`/rooms/${r.id}/messages`)); navigate('room'); });
  const leaveRoom = () => act(async () => { await api(`/rooms/${room!.id}/leave`, 'POST', {}); await stopAudio(); setRoom(null); navigate(''); await refresh(); });
  const openDm = (u: Item) => act(async () => { setMessages(await api(`/users/${u.id}/messages`)); setDm(u); navigate('dm'); });
  const sendMessage = () => act(async () => { if (!text.trim()) return; const m = await api(page === 'dm' ? `/users/${dm!.id}/messages` : `/rooms/${room!.id}/messages`, 'POST', { text }); setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]); setText(''); });
  const seatAction = (index: number, action: string) => act(async () => { await api(`/rooms/${room!.id}/seats/${index}`, 'POST', { action }); setRoom(await api(`/rooms/${room!.id}`)); });
  const openProfile = (id: string) => act(async () => { setProfile(await api(`/users/${id}`)); setDescription(''); navigate('user'); });
  const joinAudio = () => act(async () => { if (audioConnected) { await stopAudio(); return; } const credentials = await api(`/rooms/${room!.id}/rtc-token`, 'POST', {}); audioRef.current = await connectAudio(credentials.url, credentials.token, () => { audioRef.current = null; setAudioConnected(false); setMicOn(false); }); setAudioConnected(true); setNotice('Audio connected. Mic abhi off hai.'); });
  const toggleMic = () => act(async () => { if (!currentSeat || currentSeat.muted) throw new Error('Pehle ek khali seat lo. Host ne seat mute ki ho to bol nahi paoge.'); if (!audioRef.current) throw new Error('Pehle live audio connect karo.'); await audioRef.current.setMicrophone(!micOn); setMicOn(!micOn); });
  const goHome = () => { navigate(''); setDm(null); };
  const featureButtons: { name: string; note: string; key: string; icon: MIcon; colors: [string, string] }[] = [{ name: 'Rankings', note: 'Top gifters', key: 'leaderboard', icon: 'crown', colors: ['#FFB21C', '#FF6A00'] }, { name: 'Events', note: 'This week', key: 'events', icon: 'calendar-star', colors: ['#FF2E74', '#C026D3'] }, { name: 'Families', note: 'Find your gang', key: 'families', icon: 'account-group', colors: ['#8B3DFF', '#3D7BFF'] }, { name: 'Rewards', note: 'Free coins', key: 'tasks', icon: 'gift', colors: ['#00B89C', '#0EA5E9'] }];
  const filteredRooms = rooms.filter(r => (category === 'All' || r.category?.toLowerCase() === category.toLowerCase()) && `${r.title} ${r.description} ${r.category} ${r.code || ''}`.toLowerCase().includes(q.toLowerCase()));
  const back = page === 'room' ? () => navigate('') : room && ['games', 'game', 'pk', 'gifts', 'user', 'room-settings', 'queue', 'lucky'].includes(page) ? () => navigate('room') : goHome;


  const scrollRef = useRef<ScrollView>(null);
  const chatRef = useRef<ScrollView>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [page, tab]);
  const [homeTab, setHomeTab] = useState('Popular'); const [exploreTab, setExploreTab] = useState('Square'); const [meTab, setMeTab] = useState('About me');
  const [people, setPeople] = useState<Item[]>([]); const [sheet, setSheet] = useState<'' | 'gift' | 'more' | 'theme'>('');
  const [honor, setHonor] = useState<Item[]>([]); const [visitors, setVisitors] = useState<Item[]>([]); const [peopleQ, setPeopleQ] = useState(''); const [found, setFound] = useState<Item[]>([]); const [burst, setBurst] = useState<Item | null>(null); const [pickColor, setPickColor] = useState<string | null>(null); const [unoHand, setUnoHand] = useState<Item>({ cards: [], playable: [] });
  const [hometown, setHometown] = useState(''); const [birthday, setBirthday] = useState(''); const [gender, setGender] = useState(''); const [tagsText, setTagsText] = useState(''); const [entryShow, setEntryShow] = useState<Item | null>(null);
  const entryX = useRef(new Animated.Value(-520)).current; const [banner, setBanner] = useState<Item | null>(null); const [speakers, setSpeakers] = useState<string[]>([]); const [slide, setSlide] = useState(0);
  const bannerX = useRef(new Animated.Value(500)).current;
  const joinedAt = useRef<{ id?: string; at: string }>({ at: '' });
  if (room && joinedAt.current.id !== room.id) joinedAt.current = { id: room.id, at: new Date().toISOString() };

  const allPeople: Record<string, Item> = {}; for (const r of rooms) for (const p of r.people || []) allPeople[p.id] = p; for (const p of room?.people || []) allPeople[p.id] = p;
  const who = (id?: string): Item => id === user?.id ? { ...user, name: 'You' } : allPeople[id || ''] || { id, name: 'Guest' };
  const seatedIds: string[] = (room?.seats || []).map((x: Item) => x.userId).filter(Boolean);

  // Android hardware back button
  useEffect(() => { if (Platform.OS !== 'android') return; const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (sheet) { setSheet(''); return true; } if (page) { back(); return true; } if (tab !== 'Party') { setTab('Party'); return true; } return false; }); return () => sub.remove(); });
  useEffect(() => { if (token && tab === 'Explore' && !people.length) api('/rankings?period=all').then((d: Item[]) => setPeople(d.map(x => x.user))).catch(() => {}); }, [token, tab]);
  useEffect(() => { if (!giftEvent || giftEvent.roomId !== room?.id) return; setBanner({ key: giftEvent.key, from: who(giftEvent.fromId), to: who(giftEvent.recipientId), giftId: giftEvent.giftId, qty: giftEvent.quantity || 1 }); }, [giftEvent?.key]);
  // Demo rooms only: simulate who is talking and the odd gift so the sample rooms feel alive. Real rooms show real events only.
  useEffect(() => { if (page !== 'room' || !room?.demo) { setSpeakers(micOn && user ? [user.id] : []); return; } let tick = 0; const t = setInterval(() => { tick++; const others = seatedIds.filter(id => id !== user?.id); const pick = others.filter(() => Math.random() < .35).slice(0, 2); setSpeakers([...pick, ...(micOn && user ? [user.id] : [])]); if (tick % 4 === 0 && others.length > 1) { const a = others[Math.floor(Math.random() * others.length)]; const rest = others.filter(x => x !== a); const b2 = rest[Math.floor(Math.random() * rest.length)]; const g = ['rose', 'heart', 'crown', 'rocket'][Math.floor(Math.random() * 4)]; setBanner({ key: `demo-${Date.now()}`, from: who(a), to: who(b2), giftId: g, qty: [1, 1, 5, 10][Math.floor(Math.random() * 4)] }); } }, 2800); return () => clearInterval(t); }, [page, room?.id, micOn, seatedIds.join()]);
  useEffect(() => { if (!token) return; api('/me/notifications').then((n: Item[]) => { setNotifs(n); setNotifUnread(n.filter(x => !x.read).length); }).catch(() => {}); }, [token]);
  useEffect(() => { const id = page === 'user' ? profile?.id : !page && tab === 'Me' ? user?.id : null; if (!token || !id) return; setHonor([]); api(`/users/${id}/honor`).then(setHonor).catch(() => {}); }, [token, page, tab, profile?.id]);
  useEffect(() => { if (!peopleQ.trim()) { setFound([]); return; } const t = setTimeout(() => api('/people/search?q=' + encodeURIComponent(peopleQ.trim())).then(setFound).catch(() => {}), 350); return () => clearTimeout(t); }, [peopleQ]);
  useEffect(() => { if (page !== 'game' || game?.type !== 'uno' || game.status === 'waiting' || !game.playerIds?.includes(user?.id)) return; api(`/games/${game.id}/uno-hand`).then(setUnoHand).catch(() => {}); }, [page, game?.id, game?.turn, game?.top?.id, game?.phase, JSON.stringify(game?.counts || {})]);
  useEffect(() => { if (banner && ['crown', 'rocket'].includes(banner.giftId)) setBurst({ ...banner, key: 'b' + banner.key }); }, [banner?.key]);
  useEffect(() => { if (!entrance || entrance.roomId !== room?.id || entrance.user?.id === user?.id) return; setEntryShow(entrance); entryX.setValue(-520); Animated.sequence([Animated.timing(entryX, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.1)), useNativeDriver: Platform.OS !== 'web' }), Animated.delay(2400), Animated.timing(entryX, { toValue: 520, duration: 400, useNativeDriver: Platform.OS !== 'web' })]).start(() => setEntryShow(x => x?.key === entrance.key ? null : x)); }, [entrance?.key]);
  useEffect(() => { if (!banner) return; bannerX.setValue(500); Animated.sequence([Animated.timing(bannerX, { toValue: 0, duration: 450, easing: Easing.out(Easing.back(1.2)), useNativeDriver: Platform.OS !== 'web' }), Animated.delay(2600), Animated.timing(bannerX, { toValue: -520, duration: 400, useNativeDriver: Platform.OS !== 'web' })]).start(() => setBanner(x => x?.key === banner.key ? null : x)); }, [banner?.key]);
  useEffect(() => { if (page === 'room') setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 150); }, [messages.length, page]);
  useEffect(() => { const t = setInterval(() => setSlide(x => (x + 1) % 3), 4500); return () => clearInterval(t); }, []);

  if (!hydrated) return <View style={[s.outer, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={c.brand} size="large" /></View>;

  const following: string[] = user?.following || [];
  const unread = conversations.filter(cv => cv.lastMessage && cv.lastMessage.fromId !== user?.id).length + notifUnread;
  const listRooms = filteredRooms.filter(r => homeTab !== 'Following' || following.includes(r.ownerId) || r.members?.some((m: string) => following.includes(m)));
  const openGifts = () => act(async () => { if (!catalog.gifts?.length) { const g = await api('/gifts'); setCatalog(prev => ({ ...prev, gifts: g })); } if (!recipient || !room?.members?.includes(recipient)) setRecipient(seatedIds.find(id => id !== user?.id) || room?.members?.find((m: string) => m !== user?.id) || ''); setSheet('gift'); });
  const sendRoomGift = () => act(async () => { if (!selectedGift || !recipient || !room) return; await api('/gifts/send', 'POST', { giftId: selectedGift.id, recipientId: recipient, quantity: 1, roomId: room.id, idempotencyKey: giftRequestKey(selectedGift.id, recipient, room.id) }); giftKeyRef.current = null; setBanner({ key: `me-${Date.now()}`, from: user, to: who(recipient), giftId: selectedGift.id, qty: 1 }); setSheet(''); await refresh(); });
  const toggleFollow = (id: string) => act(async () => { const on = following.includes(id); await api(`/users/${id}/follow`, on ? 'DELETE' : 'POST', {}); setUser(prev => prev ? { ...prev, following: on ? (prev.following || []).filter((x: string) => x !== id) : [...(prev.following || []), id] } : prev); });
  const openEdit = () => { setName(user?.name || ''); setDescription(user?.bio || ''); setHometown(user?.hometown || ''); setBirthday(user?.birthday || ''); setGender(user?.gender || ''); setTagsText((user?.tags || []).join(', ')); navigate('edit-profile'); };
  const pickPhoto = () => act(async () => { const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .35, base64: true }); if (res.canceled || !res.assets?.[0]?.base64) return; const a = res.assets[0]; const type = a.mimeType && /png|webp/.test(a.mimeType) ? a.mimeType : 'image/jpeg'; const data = `data:${type};base64,${a.base64}`; if (data.length > 590000) throw new Error('Photo bahut badi hai. Chhoti photo chuno ya crop karo.'); const u = await api('/me/photo', 'POST', { data }); setUser(prev => prev ? { ...prev, photo: u.photo } : prev); setNotice('Profile photo update ho gayi.'); });
  const isMod = !!room && (room.ownerId === user?.id || (room.admins || []).includes(user?.id));
  const friendIds = new Set<string>([...(user?.following || []), ...(user?.followers || [])]);
  const knownConvs = conversations.filter(cv => friendIds.has(cv.user.id)); const strangerConvs = conversations.filter(cv => !friendIds.has(cv.user.id));
  const shareRoom = () => { if (room) Share.share({ message: `"${room.title}" room mein aao, Party App par. Room ID: ${room.code || room.id}` }).catch(() => {}); };
  const banners = [
    { title: 'Antakshari Mahamuqabla', sub: 'Teams of 4. Winner gets the Crown badge.', cta: 'See events', colors: ['#FF2E74', '#8B3DFF'] as [string, string], go: () => loadCatalog('events') },
    { title: 'Daily rewards are live', sub: 'Check in, send a gift, earn free coins.', cta: 'Claim now', colors: ['#00B89C', '#3D7BFF'] as [string, string], go: () => loadCatalog('tasks') },
    { title: 'Find your family', sub: 'Join a crew and climb the family rankings.', cta: 'Explore', colors: ['#FFB21C', '#FF2E74'] as [string, string], go: () => loadCatalog('families') },
  ];

  // ---------- Sign in ----------
  const authScreen = <ScrollView contentContainerStyle={[s.auth, { paddingTop: insets.top + 34, paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">
    <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.brandIcon}><Ionicons name="mic" size={40} color="white" /></LinearGradient>
    <Text style={s.wordmark}>Party App</Text>
    <Text style={s.authNote}>Live voice rooms. Real people. Good conversations.</Text>
    <View style={s.authCard}>
      <Text style={s.sectionTitle}>{register ? 'Create your account' : 'Sign in'}</Text>
      {register && <Field label="Your name" value={name} onChangeText={setName} placeholder="What should people call you?" />}
      {usePhone ? <><Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" /><Button title="Send OTP" soft disabled={busy || phone.length < 8} onPress={() => act(async () => { const r = await api('/auth/otp/request', 'POST', { phone }); setNotice(r.devCode ? `Test code: ${r.devCode}` : 'OTP bhej diya.'); })} /><Field label="6-digit OTP" value={otp} onChangeText={setOtp} placeholder="000000" /><Button title={busy ? 'Please wait...' : 'Verify and continue'} disabled={busy || otp.length !== 6} onPress={() => act(async () => { const data = await api('/auth/otp/verify', 'POST', { phone, code: otp }); await AsyncStorage.setItem('melo-session', JSON.stringify(data)); setUser(data.user); setToken(data.token); setOtp(''); })} /></>
        : <><Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" /><Field label="Password" value={password} onChangeText={setPassword} secure placeholder="At least 8 characters" /><Button title={busy ? 'Please wait...' : register ? 'Create account' : 'Sign in'} onPress={() => authenticate()} disabled={busy} /></>}
      <Pressable onPress={() => setUsePhone(!usePhone)}><Text style={[s.link, { textAlign: 'center' }]}>{usePhone ? 'Use email instead' : 'Login with phone number'}</Text></Pressable>
      <Pressable onPress={() => setRegister(!register)}><Text style={[s.link, { textAlign: 'center' }]}>{register ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text></Pressable>
      <View style={s.divider} />
      <Button title="Continue as guest" soft onPress={() => authenticate(true)} disabled={busy} />
      <Text style={[s.tiny, { textAlign: 'center' }]}>Guest accounts get 500 test coins. No real money is used.</Text>
    </View>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </ScrollView>;

  // ---------- Party (home) ----------
  const bn = banners[slide];
  const homeScreen = <>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{['All', 'Chat', 'Music', 'Friends', 'Gaming', 'Chill'].map(cat => <Pressable key={cat} onPress={() => setCategory(cat)} style={[s.chip, category === cat && s.chipOn]}><Text style={[s.chipText, category === cat && { color: 'white' }]}>{cat === 'All' ? 'Recommend' : cat}</Text></Pressable>)}</ScrollView>
    <Pressable onPress={bn.go}><LinearGradient colors={bn.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.banner}><View style={s.bannerGlow} /><Text style={s.bannerTitle}>{bn.title}</Text><Text style={s.bannerSub}>{bn.sub}</Text><View style={s.bannerCta}><Text style={s.bannerCtaText}>{bn.cta}</Text></View><View style={s.dots}>{banners.map((_, i) => <View key={i} style={[s.dot, i === slide && s.dotOn]} />)}</View></LinearGradient></Pressable>
    <View style={s.quickRow}>{featureButtons.map(f => <Pressable key={f.key} style={{ flex: 1 }} onPress={() => loadCatalog(f.key)}><LinearGradient colors={f.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.quick}><MaterialCommunityIcons name={f.icon} size={22} color="white" /><Text style={s.quickTitle}>{f.name}</Text><Text style={s.quickNote}>{f.note}</Text></LinearGradient></Pressable>)}</View>
    {/^\d{6,}$/.test(q.trim()) && <Pressable style={s.idCard} onPress={() => act(async () => { const r = await api('/room-code/' + q.trim()); setQ(''); await enterRoom(r); })}><Ionicons name="enter-outline" size={22} color={c.brand} /><Text style={[s.menuText, { flex: 1 }]}>Room ID {q.trim()} kholo</Text><Ionicons name="chevron-forward" size={18} color={c.faint} /></Pressable>}
    {listRooms.map(r => { const seated = (r.seats || []).filter((x: Item) => x.userId).length; const free = (r.seats || []).filter((x: Item) => !x.userId && !x.locked).length; const owner = (r.people || []).find((p: Item) => p.id === r.ownerId); const tc = tagColors[r.category] || brand; return <Pressable accessibilityRole="button" accessibilityLabel={`Join ${r.title}`} key={r.id} onPress={() => enterRoom(r)} style={({ pressed }) => [s.roomRow, pressed && { backgroundColor: '#FAF8FF' }]}>
      <View><Photo uri={r.cover || owner?.photo} name={r.title} size={96} radius={16} /><View style={s.liveMini}><MaterialCommunityIcons name="equalizer" size={13} color="white" /><Text style={s.liveMiniText}>LIVE</Text></View></View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={s.row}><Text style={[s.roomTitle, { flex: 1 }]}>{r.title}</Text>{r.locked && <Ionicons name="lock-closed" size={16} color={c.faint} />}</View>
        <View style={[s.row, { flexWrap: 'wrap' }]}><LinearGradient colors={tc} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tag}><Text style={s.tagText}>{r.category}</Text></LinearGradient>{owner && <Text style={s.tiny}>by {owner.name}</Text>}</View>
        <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.small}>{free > 0 ? `${free} ${free === 1 ? 'seat' : 'seats'} left for you` : `${seated} on mic`}</Text><View style={s.inline}><Ionicons name="stats-chart" size={13} color={c.text} /><Text style={s.count}>{r.members?.length || 0}</Text></View></View>
      </View>
    </Pressable>; })}
    {!loading && !listRooms.length && !/^\d{6,}$/.test(q.trim()) && <Empty title={error ? 'Rooms load nahi hue' : homeTab === 'Following' ? 'Aapke friends abhi kisi room mein nahi hain' : 'Koi room nahi mila'} note={error ? 'Upar refresh dabao. Server jaagne mein thoda time lag sakta hai.' : homeTab === 'Following' ? 'Popular tab mein naye log dhoondo aur follow karo.' : 'Kuch aur search karo, ya + dabakar apna room banao.'} />}
  </>;

  // ---------- Explore ----------
  const exploreScreen = exploreTab === 'Square' ? <>
    <View style={s.compose}><Photo uri={user?.photo} name={user?.name} size={42} /><TextInput accessibilityLabel="Write a post" value={text} onChangeText={setText} placeholder="Share something with everyone..." placeholderTextColor={c.faint} multiline style={s.composeInput} /><Pressable accessibilityLabel="Post" disabled={busy || !text.trim()} onPress={() => act(async () => { await api('/posts', 'POST', { text }); setText(''); await refresh(); setNotice('Post share ho gaya.'); })}><LinearGradient colors={brand} style={[s.sendBtn, !text.trim() && { opacity: .5 }]}><Ionicons name="send" size={18} color="white" /></LinearGradient></Pressable></View>
    {posts.map(p => { const liked = p.likes?.includes(user?.id); const isF = following.includes(p.author?.id); return <View key={p.id} style={s.post}>
      <Pressable style={s.row} onPress={() => openProfile(p.author.id)}><Photo uri={p.author?.photo} name={p.author?.name} size={46} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { flexWrap: 'wrap' }]}><Text style={s.cardTitle}>{p.author?.name}</Text><Level level={p.author?.level} gender={p.author?.gender} /></View><Text style={s.tiny}>{ago(p.createdAt)}</Text></View>{p.author?.id !== user?.id && <Pressable onPress={() => toggleFollow(p.author.id)} style={[s.followBtn, isF && s.followingBtn]}><Text style={[s.followText, isF && { color: c.muted }]}>{isF ? 'Following' : 'Follow'}</Text></Pressable>}</Pressable>
      <Text style={[s.body, { marginVertical: 12 }]}>{p.text}</Text>
      <View style={[s.row, { gap: 24 }]}>
        <Pressable style={s.inline} onPress={() => act(async () => { await api(`/posts/${p.id}/like`, liked ? 'DELETE' : 'POST', {}); await refresh(); })}><Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? c.brand : c.muted} /><Text style={s.actionText}>{p.likes?.length || 0}</Text></Pressable>
        <Pressable style={s.inline} onPress={() => act(async () => { setComments(await api(`/posts/${p.id}/comments`)); setPost(p); navigate('comments'); })}><Ionicons name="chatbubble-outline" size={20} color={c.muted} /><Text style={s.actionText}>{p.commentCount || 0}</Text></Pressable>
      </View>
    </View>; })}
    {!posts.length && <Empty title="Abhi tak koi post nahi" note="Pehla post aap karo." />}
  </> : <>
    <LinearGradient colors={['#FF2E74', '#8B3DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.partyCard}><Text style={s.partyCardTitle}>Party</Text><Text style={s.partyCardSub}>People talking right now. Tap to join them.</Text><View style={s.partyFaces}>{Object.values(allPeople).filter(p => p.id !== user?.id).slice(0, 8).map((p, i) => <Pressable key={p.id} onPress={() => { const r = rooms.find(rr => rr.members?.includes(p.id)); if (r) enterRoom(r); }} style={{ alignItems: 'center', width: '25%', marginTop: i % 2 ? 14 : 0 }}><Photo uri={p.photo} name={p.name} size={54} ring ringColors={['#FFFFFF', '#FFE08A']} /><Text style={s.faceName}>{firstName(p.name)}</Text></Pressable>)}</View></LinearGradient>
    <View style={[s.search, { backgroundColor: 'white', marginBottom: 12 }]}><Ionicons name="search" color={c.faint} size={19} /><TextInput accessibilityLabel="Search people" placeholder="Search people by name or city" placeholderTextColor={c.faint} value={peopleQ} onChangeText={setPeopleQ} style={s.searchInput} /></View>
    {!!peopleQ.trim() && <View style={s.listCard}>{found.map((p, k) => { const isF = following.includes(p.id); return <Pressable key={p.id} style={[s.msgRow, k === found.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openProfile(p.id)}><Photo uri={p.photo} name={p.name} size={48} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { flexWrap: 'wrap' }]}><Text style={s.cardTitle}>{p.name}</Text><Level level={p.level} gender={p.gender} /></View>{!!p.hometown && <Text style={s.small}>{p.hometown}</Text>}</View><Pressable onPress={() => toggleFollow(p.id)} style={[s.followBtn, isF && s.followingBtn]}><Text style={[s.followText, isF && { color: c.muted }]}>{isF ? 'Following' : 'Follow'}</Text></Pressable></Pressable>; })}{!found.length && <Text style={[s.small, { paddingVertical: 14 }]}>Koi nahi mila.</Text>}</View>}
    <Heading title="Recommended" note="People you might like" />
    <View style={s.listCard}>{people.filter(p => p.id !== user?.id).map((p, k, all) => { const isF = following.includes(p.id); return <Pressable key={p.id} style={[s.msgRow, k === all.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openProfile(p.id)}><Photo uri={p.photo} name={p.name} size={56} ring={p.vip} /><View style={{ flex: 1, gap: 4 }}><View style={[s.row, { flexWrap: 'wrap' }]}><Text style={s.cardTitle}>{p.name}</Text><Level level={p.level} gender={p.gender} /></View><Text style={s.small}>{p.bio || 'New user'}</Text></View><Pressable onPress={() => toggleFollow(p.id)} style={[s.followBtn, isF && s.followingBtn]}><Text style={[s.followText, isF && { color: c.muted }]}>{isF ? 'Following' : 'Follow'}</Text></Pressable></Pressable>; })}</View>
  </>;

  // ---------- Messages ----------
  const onlineFriends = Object.values(allPeople).filter(p => p.id !== user?.id);
  const messagesScreen = <>
    {onlineFriends.length > 0 && <><Text style={[s.label, { marginBottom: 12 }]}>Friends online</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>{onlineFriends.slice(0, 12).map(p => <Pressable key={p.id} style={{ alignItems: 'center', gap: 4, width: 66 }} onPress={() => { const r = rooms.find(rr => rr.members?.includes(p.id)); if (r) enterRoom(r); }}><View><Photo uri={p.photo} name={p.name} size={60} /><View style={s.onlineDot} /></View><Text style={s.faceLabel}>{firstName(p.name)}</Text><Text style={s.tiny}>In a room</Text></Pressable>)}</ScrollView></>}
    <View style={s.listCard}>
      <View style={s.msgRow}><LinearGradient colors={brand} style={s.sysIcon}><Ionicons name="megaphone" size={22} color="white" /></LinearGradient><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.cardTitle}>Party App Team</Text><Text style={s.tiny}>Today</Text></View><Text style={s.small}>Welcome! Tap any room on Party to join the conversation.</Text></View></View>
      <Pressable style={s.msgRow} onPress={() => act(async () => { setVisitors(await api('/me/visitors')); navigate('visitors'); })}><LinearGradient colors={['#8B3DFF', '#3D7BFF']} style={s.sysIcon}><Ionicons name="eye" size={22} color="white" /></LinearGradient><View style={{ flex: 1, gap: 3 }}><Text style={s.cardTitle}>People who visited me</Text><Text style={s.small}>Dekho kaun aapki profile par aaya</Text></View><Ionicons name="chevron-forward" size={18} color={c.faint} /></Pressable>
      {strangerConvs.length > 0 && <Pressable style={s.msgRow} onPress={() => navigate('strangers')}><View style={{ width: 54, height: 54 }}>{strangerConvs.slice(0, 2).map((cv, i) => <View key={cv.user.id} style={{ position: 'absolute', left: i * 14, top: i * 14 }}><Photo uri={cv.user.photo} name={cv.user.name} size={38} /></View>)}</View><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.cardTitle}>Stranger messages</Text><Text style={s.tiny}>{ago(strangerConvs[0]?.lastMessage?.createdAt)}</Text></View><View style={s.row}><Text style={[s.small, { flex: 1 }]}>{strangerConvs[0]?.user?.name}: {strangerConvs[0]?.lastMessage?.text}</Text><View style={s.badge}><Text style={s.badgeText}>{strangerConvs.length}</Text></View></View></View></Pressable>}
      {knownConvs.map((cv, k) => { const mine = cv.lastMessage?.fromId === user?.id; return <Pressable key={cv.user.id} style={[s.msgRow, k === knownConvs.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openDm(cv.user)}><Photo uri={cv.user.photo} name={cv.user.name} size={54} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.cardTitle, { flex: 1 }]}>{cv.user.name}</Text><Text style={s.tiny}>{ago(cv.lastMessage?.createdAt)}</Text></View><View style={s.row}><Text style={[s.small, { flex: 1 }]}>{mine ? 'You: ' : ''}{cv.lastMessage?.text || 'Say hello'}</Text>{!mine && <View style={s.badge}><Text style={s.badgeText}>1</Text></View>}</View></View></Pressable>; })}
    </View>
    {!conversations.length && <Empty title="Inbox khali hai" note="Kisi ki profile kholo aur message bhejo." />}
  </>;

  const aboutRows = (p?: Item | null) => <View style={{ gap: 12 }}>
    <View style={s.row}><Ionicons name="location-outline" size={19} color={c.muted} /><Text style={s.small}>{p?.hometown || 'Hometown not added'}</Text></View>
    <View style={s.row}><Ionicons name="calendar-outline" size={19} color={c.muted} /><Text style={s.small}>{p?.birthday ? `${new Date(p.birthday + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long' })} · ${zodiac(p.birthday)}` : 'Birthday not added'}</Text></View>
    <View style={s.row}><Ionicons name="star-outline" size={19} color={c.muted} /><Text style={s.small}>Level {p?.level || 1}</Text></View>
    {!!p?.tags?.length && <View style={s.wrap}>{p.tags.map((t: string) => <View key={t} style={s.tagChip}><Text style={s.tagChipText}>{t}</Text></View>)}</View>}
  </View>;
  const honorGrid = <View style={s.medalGrid}>{honor.map(m => <View key={m.id} style={[s.medal, !m.earned && { opacity: .55 }]}><LinearGradient colors={m.earned ? ['#FFD54A', '#FF9F1C'] : ['#D9D5E6', '#B9B4CC']} style={s.medalIcon}><MaterialCommunityIcons name={({ generous: 'hand-heart', star: 'star-shooting', host: 'microphone-variant', popular: 'account-heart', writer: 'feather', veteran: 'shield-star' } as Record<string, MIcon>)[m.id] || 'medal'} size={26} color="white" /></LinearGradient><Text style={s.medalName}>{m.name}</Text><Text style={s.tiny}>{m.desc}</Text><View style={s.progressTrack}><View style={[s.progressFill, { width: `${Math.min(100, Math.round(m.value / m.goal * 100))}%` }]} /></View><Text style={s.tiny}>{Math.min(m.value, m.goal)}/{m.goal}</Text></View>)}{!honor.length && <ActivityIndicator color={c.brand} />}</View>;

  // ---------- Me ----------
  const friends = following.filter(id => user?.followers?.includes(id)).length;
  const myPosts = posts.filter(p => p.author?.id === user?.id);
  const meScreen = <>
    <LinearGradient colors={['#FF2E74', '#8B3DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.meHead, { paddingTop: insets.top + 14 }]}>
      <View style={s.meGlow} />
      <View style={[s.row, { justifyContent: 'flex-end', gap: 12 }]}><Pressable accessibilityLabel="Edit profile" style={s.glassBtn} onPress={() => { openEdit(); }}><Ionicons name="create-outline" size={20} color="white" /></Pressable><Pressable accessibilityLabel="Settings" style={s.glassBtn} onPress={() => navigate('settings')}><Ionicons name="settings-outline" size={20} color="white" /></Pressable></View>
      <View style={[s.row, { gap: 14, marginTop: 6 }]}><Photo uri={user?.photo} name={user?.name} size={84} ring ringColors={['#FFFFFF', '#FFE08A']} /><View style={{ flex: 1, gap: 6 }}><View style={[s.row, { flexWrap: 'wrap' }]}><Text style={s.meName}>{user?.name}</Text><Level level={user?.level} gender={user?.gender} /></View><Text style={s.meId}>ID: {shortId(user?.id)}</Text>{user?.vip && <View style={s.vipTag}><MaterialCommunityIcons name="crown" size={13} color="#7A4A00" /><Text style={s.vipTagText}>VIP</Text></View>}</View></View>
    </LinearGradient>
    <View style={s.meBody}>
      <View style={s.statsRow}>{([['Followers', user?.followers?.length ?? 0], ['Following', following.length], ['Friends', friends]] as [string, number][]).map(([l, n]) => <View key={l} style={s.stat}><Text style={s.statNum}>{n}</Text><Text style={s.statLabel}>{l}</Text></View>)}</View>
      <View style={[s.row, { gap: 10 }]}><Pressable style={{ flex: 1 }} onPress={() => loadCatalog('families')}><LinearGradient colors={['#FFE1EC', '#FFF4F8']} style={s.miniCard}><Text style={s.miniTitle}>Family</Text><Text style={s.small}>Join a crew</Text></LinearGradient></Pressable><Pressable style={{ flex: 1 }} onPress={() => loadCatalog('leaderboard')}><LinearGradient colors={['#FFF0CC', '#FFF9EB']} style={s.miniCard}><Text style={s.miniTitle}>Rankings</Text><Text style={s.small}>This week</Text></LinearGradient></Pressable></View>
      <Pressable onPress={openWallet} style={s.walletCard}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.cardTitle}>Wallet</Text><View style={s.row}><Coin n={user?.coins ?? 0} /><Diamond n={user?.diamonds ?? 0} /><Ionicons name="chevron-forward" size={18} color={c.faint} /></View></View>
        <View style={[s.row, { gap: 10, marginTop: 12 }]}><Pressable style={s.walletTile} onPress={() => loadCatalog('vip')}><MaterialCommunityIcons name="crown" size={26} color={c.gold} /><View><Text style={s.menuText}>VIP</Text><Text style={s.tiny}>{user?.vip ? 'Active' : 'Not active'}</Text></View></Pressable><Pressable style={s.walletTile} onPress={() => loadCatalog('decorations')}><MaterialCommunityIcons name="shield-crown" size={26} color={c.violet} /><View><Text style={s.menuText}>Style shop</Text><Text style={s.tiny}>Frames, badges</Text></View></Pressable></View>
      </Pressable>
      <View style={{ marginTop: 18, marginBottom: 6 }}><Tabs items={['About me', 'Honor', 'Posts']} value={meTab} onChange={setMeTab} /></View>
      {meTab === 'About me' ? <View style={{ gap: 14, paddingVertical: 8 }}><Text style={s.body}>{user?.bio || 'Introduce yourself in a few words.'}</Text>{aboutRows(user)}<Button title="Edit details" soft onPress={openEdit} /><Button title="Daily rewards" soft onPress={() => loadCatalog('tasks')} /></View>
        : meTab === 'Honor' ? honorGrid
        : <>{myPosts.map(p => <View key={p.id} style={s.post}><Text style={s.tiny}>{ago(p.createdAt)}</Text><Text style={[s.body, { marginTop: 6 }]}>{p.text}</Text></View>)}{!myPosts.length && <Empty title="No posts yet" note="Explore tab se apna pehla post share karo." />}</>}
    </View>
  </>;

  // ---------- Room (full screen) ----------
  const seatView = (seat: Item) => { const p = seat.userId ? who(seat.userId) : null; const isHost = !!seat.userId && seat.userId === room?.ownerId; return <View key={seat.index} style={s.seatCell}>
    <Pressable accessibilityLabel={`Seat ${seat.index + 1}${seat.locked ? ' locked' : ''}`} onPress={() => { if (seat.userId && seat.userId !== user?.id) openProfile(seat.userId); else seatAction(seat.index, seat.userId === user?.id ? 'leave' : 'take'); }} style={s.seatHit}>
      {p ? <><SpeakRing active={speakers.includes(p.id)} size={68} /><Photo uri={p.photo} name={p.name} size={58} ring ringColors={frameColors(p.equipped) || (isHost ? ['#FFE08A', '#FF9F1C'] : ['#B794FF', '#FF5C9A'])} />{!isHost && (room?.admins || []).includes(p.id) && <View style={s.adminTag}><Text style={s.adminTagText}>Admin</Text></View>}{isHost && <View style={s.crown}><MaterialCommunityIcons name="crown" size={18} color={c.gold} /></View>}{seat.muted && <View style={s.muteBadge}><Ionicons name="mic-off" size={11} color="white" /></View>}</>
        : <View style={s.seatEmpty}>{seat.locked ? <Ionicons name="lock-closed" size={20} color="#FFFFFFB3" /> : <MaterialCommunityIcons name="sofa-single" size={24} color="#FFFFFFB3" />}</View>}
    </Pressable>
    <Text style={s.seatName} numberOfLines={1}>{p ? firstName(p.name) : `No.${seat.index + 1}`}</Text>
    {p ? <View style={{ alignItems: 'center' }}><Level level={p.level || 1} /></View> : <View style={{ height: 18 }} />}
  </View>; };
  const roomMessages = messages.filter(m => m.roomId === room?.id);
  const firstAfterJoin = roomMessages.find(m => m.createdAt >= joinedAt.current.at);
  const roomTools: { t: string; i: Icon; col: [string, string]; fn: () => void }[] = room ? [
    { t: 'Games', i: 'game-controller', col: ['#8B3DFF', '#3D7BFF'], fn: () => { setSheet(''); loadCatalog('games'); } },
    { t: 'Mic queue', i: 'hand-left', col: ['#00B89C', '#0EA5E9'], fn: () => { setSheet(''); act(async () => { setQueue(await api(`/rooms/${room.id}/queue`)); navigate('queue'); }); } },
    { t: 'Lucky bag', i: 'cash', col: ['#FF6A00', '#E5484D'], fn: () => { setSheet(''); act(async () => { setBags(await api(`/rooms/${room.id}/lucky-bags`)); navigate('lucky'); }); } },
    { t: 'PK battle', i: 'flash', col: ['#FFB21C', '#FF2E74'], fn: () => { setSheet(''); act(async () => { setBattle(await api(`/rooms/${room.id}/pk`)); navigate('pk'); }); } },
    { t: audioConnected ? 'Leave audio' : 'Listen live', i: 'headset', col: ['#3D7BFF', '#6366F1'], fn: () => { setSheet(''); joinAudio(); } },
    ...(room.ownerId === user?.id ? [{ t: room.locked ? 'Unlock room' : 'Lock room', i: (room.locked ? 'lock-open' : 'lock-closed') as Icon, col: ['#64748B', '#334155'] as [string, string], fn: () => { setSheet(''); act(async () => { await api(`/rooms/${room.id}`, 'PATCH', { locked: !room.locked }); setRoom(await api(`/rooms/${room.id}`)); }); } }, { t: 'Settings', i: 'settings' as Icon, col: ['#C026D3', '#8B3DFF'] as [string, string], fn: () => { setSheet(''); setTitle(room.title); setDescription(room.description || ''); setPassword(''); navigate('room-settings'); } }] : []),
    ...(isMod ? [{ t: 'Theme', i: 'color-palette' as Icon, col: ['#00B89C', '#8B3DFF'] as [string, string], fn: () => setSheet('theme') }] : []),
    { t: 'Share', i: 'share-social', col: ['#0EA5E9', '#3D7BFF'], fn: () => { setSheet(''); shareRoom(); } },
    { t: 'Leave room', i: 'exit', col: ['#E5484D', '#B4232A'], fn: () => { setSheet(''); leaveRoom(); } },
  ] : [];
  const roomScreen = room && <View style={{ flex: 1 }}>
    <LinearGradient colors={(THEMES[room.theme] || THEMES.galaxy).colors} start={{ x: 0, y: 0 }} end={{ x: .6, y: 1 }} style={StyleSheet.absoluteFill} />
    <View style={[s.glow, { top: 80, left: -80, backgroundColor: '#FF2E7433' }]} /><View style={[s.glow, { top: 330, right: -90, backgroundColor: '#3D7BFF33' }]} />
    <View style={[s.roomTop, { paddingTop: insets.top + 8 }]}>
      <Photo uri={room.cover || who(room.ownerId).photo} name={room.title} size={42} radius={12} />
      <View style={{ flex: 1, gap: 2 }}><Text style={s.roomTopTitle} numberOfLines={2}>{room.title}</Text><Text style={s.roomTopId}>ID {room.code || shortId(room.id).slice(0, 8)}</Text></View>
      <View style={s.onlineStack}>{(room.people || []).filter((p: Item) => !seatedIds.includes(p.id)).slice(0, 2).map((p: Item, i: number) => <View key={p.id} style={{ marginLeft: i ? -10 : 0, borderRadius: 16, borderWidth: 1.5, borderColor: '#1A0B3B' }}><Photo uri={p.photo} name={p.name} size={28} /></View>)}<View style={s.onlinePill}><Text style={s.onlinePillText}>{room.members?.length || 0}</Text></View></View>
      <Pressable accessibilityLabel="Share room" style={s.topIcon} onPress={shareRoom}><Ionicons name="share-social-outline" size={19} color="white" /></Pressable>
      <Pressable accessibilityLabel="Minimize room" style={s.topIcon} onPress={() => navigate('')}><Ionicons name="chevron-down" size={22} color="white" /></Pressable>
      <Pressable accessibilityLabel="Leave room" style={s.topIcon} onPress={leaveRoom}><Ionicons name="power" size={20} color="white" /></Pressable>
    </View>
    <View style={s.noticeStrip}><Ionicons name="megaphone-outline" size={15} color="#FFD36A" /><Text style={s.noticeStripText}>{room.notice || room.description || 'Welcome! Be kind and have fun.'}</Text></View>
    <View style={s.seatGrid}>{(room.seats || []).map(seatView)}</View>
    {banner && <Animated.View style={[s.giftBanner, { transform: [{ translateX: bannerX }] }]}><LinearGradient colors={['#FF2E74F0', '#8B3DFFF0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.giftBannerInner}><Photo uri={banner.from?.photo} name={banner.from?.name} size={36} /><View style={{ flex: 1 }}><Text style={s.gbName} numberOfLines={1}>{banner.from?.name}</Text><Text style={s.gbText} numberOfLines={1}>sent {banner.giftId ? banner.giftId[0].toUpperCase() + banner.giftId.slice(1) : 'a gift'} to {banner.to?.name}</Text></View><GiftArt id={banner.giftId} size={40} /><Text style={s.gbQty}>x{banner.qty}</Text></LinearGradient></Animated.View>}
    <ScrollView ref={chatRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 10, gap: 8 }}>
      <View style={s.sysMsg}><Text style={s.sysMsgText}>Welcome to {room.title}. Respect everyone, no abuse or spam. Have fun!</Text></View>
      {roomMessages.map(m => { const joinLine = m === firstAfterJoin ? <View key="joined" style={s.sysMsg}><Text style={s.sysMsgText}>{user?.name} joined the room</Text></View> : null; const line = (() => { const p = m.fromId === user?.id ? user : (m.author?.photo !== undefined ? m.author : who(m.fromId)); return <View key={m.id} style={s.chatLine}><Pressable onPress={() => { if (m.fromId !== user?.id) openProfile(m.fromId); }}><Photo uri={p?.photo} name={p?.name} size={30} /></Pressable><View style={s.chatPill}><View style={s.row}><Level level={p?.level || 1} /><Text style={[s.chatName, (p?.vip || m.fromId === user?.id) && { color: '#FFD36A' }]}>{m.fromId === user?.id ? 'You' : p?.name}</Text>{p?.equipped?.badge && <MaterialCommunityIcons name="star-circle" size={15} color="#FFD54A" />}{(room.admins || []).includes(m.fromId) && <Text style={s.adminInline}>Admin</Text>}</View><Text style={s.chatText}>{m.text}</Text></View></View>; })(); return <React.Fragment key={m.id}>{joinLine}{line}</React.Fragment>; })}
      {!firstAfterJoin && <View style={s.sysMsg}><Text style={s.sysMsgText}>{user?.name} joined the room</Text></View>}
    </ScrollView>
    <View style={[s.roomBottom, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]}>
      <View style={s.roomInput}><TextInput accessibilityLabel="Message" placeholder="Say hi..." placeholderTextColor="#FFFFFF80" value={text} onChangeText={setText} onSubmitEditing={sendMessage} style={s.roomInputText} />{!!text.trim() && <Pressable accessibilityLabel="Send message" onPress={sendMessage}><Ionicons name="send" size={20} color="#FF7AB0" /></Pressable>}</View>
      <Pressable accessibilityLabel={micOn ? 'Mute microphone' : 'Microphone'} style={[s.roomIcon, micOn && { backgroundColor: c.teal }]} onPress={() => { if (!currentSeat) { setNotice('Bolne ke liye pehle khali seat par tap karo.'); return; } if (!audioConnected) { setNotice('Live voice ke liye server par audio service lagani hogi. Abhi text chat chalu hai.'); return; } toggleMic(); }}><Ionicons name={micOn ? 'mic' : 'mic-off'} size={22} color="white" /></Pressable>
      <Pressable accessibilityLabel="More" style={s.roomIcon} onPress={() => setSheet('more')}><Ionicons name="apps" size={21} color="white" /></Pressable>
      <Pressable accessibilityLabel="Send gift" onPress={openGifts}><LinearGradient colors={['#FFB21C', '#FF2E74']} style={s.giftFab}><MaterialCommunityIcons name="gift" size={24} color="white" /></LinearGradient></Pressable>
    </View>
    {!!notice && <View style={[s.roomToast, { bottom: insets.bottom + 80 }]}><Text style={s.roomToastText}>{notice}</Text></View>}
    {!!error && <Pressable onPress={() => setError('')} style={[s.roomToast, { bottom: insets.bottom + 80, backgroundColor: '#B4232AEE' }]}><Text style={s.roomToastText}>{error}</Text></Pressable>}
    {sheet !== '' && <Pressable style={s.scrim} onPress={() => setSheet('')} />}
    {sheet === 'more' && <View style={[s.sheet, { paddingBottom: insets.bottom + 18 }]}><View style={s.grabber} /><Text style={s.sheetTitle}>Room tools</Text><View style={s.toolGrid}>{roomTools.map(x => <Pressable key={x.t} style={s.toolItem} onPress={x.fn}><LinearGradient colors={x.col} style={s.toolIcon}><Ionicons name={x.i} size={24} color="white" /></LinearGradient><Text style={s.toolLabel}>{x.t}</Text></Pressable>)}</View></View>}
    {sheet === 'theme' && <View style={[s.sheet, { paddingBottom: insets.bottom + 18 }]}><View style={s.grabber} /><Text style={s.sheetTitle}>Room theme</Text><View style={s.toolGrid}>{Object.entries(THEMES).map(([k, t]) => <Pressable key={k} style={s.toolItem} onPress={() => { setSheet(''); act(async () => { setRoom(await api(`/rooms/${room.id}/theme`, 'POST', { theme: k })); }); }}><LinearGradient colors={t.colors} style={[s.themeSwatch, (room.theme || 'galaxy') === k && { borderColor: 'white' }]} /><Text style={s.toolLabel}>{t.name}</Text></Pressable>)}</View></View>}
    {entryShow && <Animated.View pointerEvents="none" style={[s.entryWrap, { transform: [{ translateX: entryX }] }]}><LinearGradient colors={entryShow.entrance === 'entrance-rocket' ? ['#3D7BFF', '#8B3DFF'] : entryShow.entrance === 'entrance-confetti' ? ['#FF9F1C', '#FF2E74'] : ['#FFFFFF33', '#FFFFFF14']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.entryInner}><Photo uri={entryShow.user?.photo} name={entryShow.user?.name} size={34} /><Text style={s.entryText} numberOfLines={1}>{entryShow.user?.name} joined the room</Text>{entryShow.entrance && <MaterialCommunityIcons name={entryShow.entrance === 'entrance-rocket' ? 'rocket-launch' : 'party-popper'} size={22} color="white" />}</LinearGradient></Animated.View>}
    <GiftBurst burst={burst} />
    {sheet === 'gift' && <View style={[s.sheet, { paddingBottom: insets.bottom + 14 }]}><View style={s.grabber} />
      <Text style={s.sheetLabel}>Send to</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>{(room.members || []).filter((id: string) => id !== user?.id).map((id: string) => { const p = who(id); const on = recipient === id; return <Pressable key={id} onPress={() => setRecipient(id)} style={{ alignItems: 'center', gap: 4, width: 58 }}><View style={[s.pickRing, on && { borderColor: c.brand }]}><Photo uri={p.photo} name={p.name} size={44} /></View><Text style={[s.pickName, on && { color: 'white' }]} numberOfLines={1}>{firstName(p.name)}</Text></Pressable>; })}{(room.members || []).length < 2 && <Text style={s.sheetMuted}>Room mein abhi koi aur nahi hai.</Text>}</ScrollView>
      <View style={s.giftGrid}>{(catalog.gifts || []).map(g => { const on = selectedGift?.id === g.id; return <Pressable key={g.id} onPress={() => setSelectedGift(g)} style={[s.giftCell, on && s.giftCellOn]}><GiftArt id={g.id} size={52} /><Text style={s.giftName}>{g.name}</Text><Coin n={g.cost} size={13} dark /></Pressable>; })}</View>
      <View style={[s.row, { justifyContent: 'space-between', marginTop: 6 }]}><Pressable onPress={() => { setSheet(''); openWallet(); }}><Coin n={user?.coins ?? 0} size={16} dark /></Pressable><Pressable disabled={busy || !selectedGift || !recipient} onPress={sendRoomGift} style={{ opacity: busy || !selectedGift || !recipient ? .5 : 1 }}><LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sendGift}><Text style={s.buttonText}>Send</Text></LinearGradient></Pressable></View>
    </View>}
  </View>;

  // ---------- Detail pages ----------
  const dmView = <><View style={{ gap: 12, paddingVertical: 6 }}>{messages.filter(m => (m.fromId === dm?.id && m.toId === user?.id) || (m.fromId === user?.id && m.toId === dm?.id)).map(m => { const mine = m.fromId === user?.id; return <View key={m.id} style={[s.row, { alignItems: 'flex-end', alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%' }]}>{!mine && <Photo uri={dm?.photo} name={dm?.name} size={32} />}{mine ? <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.bubble, s.bubbleMine]}><Text style={[s.body, { color: 'white' }]}>{m.text}</Text><Text style={[s.bubbleTime, { color: '#FFFFFFB3' }]}>{ago(m.createdAt)}</Text></LinearGradient> : <View style={s.bubble}><Text style={s.body}>{m.text}</Text><Text style={s.bubbleTime}>{ago(m.createdAt)}</Text></View>}</View>; })}</View>
    <View style={s.composer}><TextInput accessibilityLabel="Message" placeholder="Type a message..." placeholderTextColor={c.faint} value={text} onChangeText={setText} style={s.composerInput} onSubmitEditing={sendMessage} /><Pressable accessibilityLabel="Send message" disabled={!text.trim() || busy} onPress={sendMessage}><LinearGradient colors={brand} style={[s.sendBtn, !text.trim() && { opacity: .5 }]}><Ionicons name="send" size={18} color="white" /></LinearGradient></Pressable></View></>;

  let detail: React.ReactNode = null;
  if (page === 'join-locked') detail = <View style={s.form}><Text style={s.sectionTitle}>{pendingRoom?.title}</Text><Text style={s.bodyMuted}>Ye private room hai. Password host se pucho.</Text><Field label="Room password" value={password} onChangeText={setPassword} secure /><Button title="Enter room" disabled={busy || !password} onPress={() => enterRoom(pendingRoom!, password)} /></View>;
  if (page === 'room-settings' && room) detail = <View style={s.form}><Field label="Room name" value={title} onChangeText={setTitle} /><Field label="Description" value={description} onChangeText={setDescription} multiline /><Field label="New room password (optional)" value={password} onChangeText={setPassword} secure /><Text style={s.small}>Password kam se kam 4 characters ka rakho, phir room lock karo to private ho jayega.</Text><Button title="Save changes" disabled={busy || !title.trim()} onPress={() => act(async () => { await api(`/rooms/${room.id}`, 'PATCH', { title, description, ...(password ? { password } : {}) }); setRoom(await api(`/rooms/${room.id}`)); navigate('room'); setPassword(''); setNotice('Room update ho gaya.'); })} /><Heading title="Members" /><View style={s.listCard}>{room.members?.filter((id: string) => id !== user?.id).map((id: string) => <View key={id} style={s.msgRow}><Photo uri={who(id).photo} name={who(id).name} size={44} /><Text style={[s.menuText, { flex: 1 }]}>{who(id).name}</Text><Button small soft title="Remove" onPress={() => act(async () => { await api(`/rooms/${room.id}/kick`, 'POST', { userId: id }); setRoom(await api(`/rooms/${room.id}`)); })} /></View>)}</View></View>;
  if (page === 'games') detail = <><Text style={s.bodyMuted}>Room mein kisi ke saath khelo. Sirf masti, koi betting nahi.</Text><Pressable disabled={!room || busy} onPress={() => act(async () => { setGame(await api('/games/ludo', 'POST', { roomId: room?.id })); navigate('game'); })} style={{ marginTop: 14 }}><LinearGradient colors={['#E5484D', '#F2B705', '#1FA35B', '#2D7FF9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ludoCard}><View style={{ flex: 1, gap: 4 }}><Text style={s.ludoCardTitle}>Ludo</Text><Text style={s.ludoCardSub}>2 se 4 players. Friends ke saath ya computer ke saath khelo.</Text><View style={s.ludoCardBtn}><Text style={s.ludoCardBtnText}>New game</Text></View></View><Dice value={6} size={70} /></LinearGradient></Pressable><Pressable disabled={!room || busy} onPress={() => act(async () => { setGame(await api('/games/uno', 'POST', { roomId: room?.id })); navigate('game'); })} style={{ marginTop: 12 }}><LinearGradient colors={['#1D1238', '#3B1E7A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ludoCard}><View style={{ flex: 1, gap: 4 }}><Text style={s.ludoCardTitle}>UNO</Text><Text style={s.ludoCardSub}>Rang ya number milao, sabse pehle cards khatam karo.</Text><View style={s.ludoCardBtn}><Text style={s.ludoCardBtnText}>New game</Text></View></View><View style={{ flexDirection: 'row' }}><View style={{ transform: [{ rotate: '-12deg' }] }}><UnoCard card={{ color: 'red', value: '7' }} w={44} /></View><View style={{ marginLeft: -16, transform: [{ rotate: '10deg' }] }}><UnoCard card={{ color: 'wild', value: 'wild4' }} w={44} /></View></View></LinearGradient></Pressable><View style={[s.row, { gap: 12, marginVertical: 14 }]}><Pressable style={{ flex: 1 }} disabled={!room || busy} onPress={() => act(async () => { setGame(await api('/games', 'POST', { roomId: room?.id })); navigate('game'); })}><LinearGradient colors={['#8B3DFF', '#3D7BFF']} style={s.gameTile}><MaterialCommunityIcons name="pound" size={44} color="white" /><Text style={s.gameTileText}>Tic-tac-toe</Text></LinearGradient></Pressable><Pressable style={{ flex: 1 }} disabled={!room || busy} onPress={() => act(async () => { setGame(await api('/games/connect-four', 'POST', { roomId: room?.id })); navigate('game'); })}><LinearGradient colors={['#FFB21C', '#FF2E74']} style={s.gameTile}><MaterialCommunityIcons name="dots-grid" size={44} color="white" /><Text style={s.gameTileText}>Connect Four</Text></LinearGradient></Pressable></View>{catalog.games?.filter(g => g.roomId === room?.id).length ? <Heading title="Games in this room" /> : null}{catalog.games?.filter(g => g.roomId === room?.id).map(g => <View style={[s.card, s.row]} key={g.id}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{g.type === 'ludo' ? 'Ludo' : g.type === 'uno' ? 'UNO' : g.type === 'connect-four' ? 'Connect Four' : 'Tic-tac-toe'}</Text><Text style={s.small}>{g.players?.map((p: Item) => p.name).join(g.type === 'ludo' || g.type === 'uno' ? ', ' : ' vs ')} · {g.status === 'waiting' ? 'waiting for players' : g.status}</Text></View><Button small title={g.playerIds?.includes(user?.id) || g.status !== 'waiting' ? 'Open' : 'Join'} onPress={() => act(async () => { const joinPath = g.type === 'ludo' ? 'ludo-join' : g.type === 'uno' ? 'uno-join' : 'join'; setGame(g.playerIds?.includes(user?.id) || g.status !== 'waiting' ? g : await api(`/games/${g.id}/${joinPath}`, 'POST', {})); navigate('game'); })} /></View>)}</>;
  if (page === 'game' && game && game.type === 'ludo') { const players: Item[] = game.players || []; const isHost = game.hostId === user?.id; const inGame = game.playerIds?.includes(user?.id); const myTurn = game.status === 'playing' && game.turn === user?.id; const canRoll = myTurn && game.phase === 'roll'; const turnP = players.find(p => p.id === game.turn); const winner = players.find(p => p.id === game.winnerId); const ludoAct = (path: string, body: Item = {}) => act(async () => { setGame(await api(`/games/${game.id}/${path}`, 'POST', body)); }); const boardSize = Math.min(width, 520) - 28;
    detail = game.status === 'waiting' ? <View style={s.form}><LinearGradient colors={['#E5484D', '#F2B705', '#1FA35B', '#2D7FF9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, { alignItems: 'center' }]}><Dice value={6} size={64} /><Text style={s.heroTitle}>Ludo</Text><Text style={[s.heroSub, { textAlign: 'center' }]}>6 aane par goti bahar niklegi. Jo pehle chaaron goti ghar pahuncha de, wo jeeta.</Text></LinearGradient><Heading title={`Players (${players.length}/4)`} /><View style={s.listCard}>{[0, 1, 2, 3].map(i => { const p = players[i]; return <View key={i} style={[s.msgRow, i === 3 && { borderBottomWidth: 0 }]}>{p ? <Photo uri={p.photo} name={p.name} size={44} /> : <View style={s.emptySlot}><Ionicons name="person-add-outline" size={20} color={c.faint} /></View>}<View style={{ flex: 1 }}><Text style={s.menuText}>{p ? (p.id === user?.id ? 'You' : p.name) : 'Waiting for player...'}</Text>{p && <Text style={s.tiny}>{p.bot ? 'Computer player' : p.id === game.hostId ? 'Host' : 'Player'}</Text>}</View></View>; })}</View>{!inGame && players.length < 4 && <Button title="Join game" disabled={busy} onPress={() => ludoAct('ludo-join')} />}{isHost && players.length < 4 && <Button title="Add computer player" soft disabled={busy} onPress={() => ludoAct('ludo-bot')} />}{isHost ? <Button title={players.length >= 2 ? 'Start game' : 'Kam se kam 2 players chahiye'} disabled={busy || players.length < 2} onPress={() => ludoAct('ludo-start')} /> : <Text style={[s.small, { textAlign: 'center' }]}>Host game shuru karega. Room ke dusre log bhi join kar sakte hain.</Text>}</View>
    : <View style={{ gap: 12 }}><View style={s.ludoPlayers}>{players.map(p => { const col = game.colors?.[p.id]; const home = (game.tokens?.[p.id] || []).filter((x: number) => x === 56).length; const on = game.turn === p.id && game.status === 'playing'; return <View key={p.id} style={[s.ludoChip, { borderColor: on ? LUDO[col] : 'transparent', backgroundColor: on ? LUDO_SOFT[col] : 'white' }]}><View style={{ borderWidth: 2.5, borderColor: LUDO[col], borderRadius: 22 }}><Photo uri={p.photo} name={p.name} size={34} /></View><View style={{ flexShrink: 1 }}><Text style={s.ludoChipName} numberOfLines={1}>{p.id === user?.id ? 'You' : p.bot ? p.name : firstName(p.name)}</Text><Text style={s.tiny}>{home}/4 home</Text></View></View>; })}</View>
      <LudoBoard g={game} me={user?.id} size={boardSize} onToken={i => ludoAct('ludo-move', { token: i })} />
      <View style={s.ludoBar}><Pressable disabled={!canRoll || busy} onPress={() => ludoAct('roll')}><Dice value={game.dice} size={62} /></Pressable><View style={{ flex: 1, gap: 3 }}><Text style={s.cardTitle}>{game.status === 'finished' ? (game.winnerId === user?.id ? 'Aap jeet gaye!' : `${winner?.name || 'Player'} jeet gaye!`) : myTurn ? (game.phase === 'roll' ? 'Aapki baari. Dice roll karo.' : 'Chamakti goti par tap karo.') : `${turnP?.name || 'Player'} ki baari`}</Text>{!!game.log?.[0] && <Text style={s.small}>{game.log[0]}</Text>}</View>{canRoll && <Button small title="Roll" disabled={busy} onPress={() => ludoAct('roll')} />}</View>
      {game.log?.length > 1 && <View style={s.infoBox}>{game.log.slice(1, 4).map((l: string, k: number) => <Text key={k} style={s.small}>{l}</Text>)}</View>}
      {game.status === 'finished' && <Button title="New game" onPress={() => act(async () => { setGame(await api('/games/ludo', 'POST', { roomId: game.roomId })); })} />}
    </View>; }
  if (page === 'game' && game && game.type === 'uno') { const players: Item[] = game.players || []; const isHost = game.hostId === user?.id; const inGame = game.playerIds?.includes(user?.id); const myTurn = game.status === 'playing' && game.turn === user?.id; const turnP = players.find(p => p.id === game.turn); const winner = players.find(p => p.id === game.winnerId); const unoAct = (path: string, body: Item = {}) => act(async () => { setGame(await api(`/games/${game.id}/${path}`, 'POST', body)); setPickColor(null); });
    detail = game.status === 'waiting' ? <View style={s.form}><LinearGradient colors={['#1D1238', '#3B1E7A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, { alignItems: 'center' }]}><View style={{ flexDirection: 'row' }}><UnoCard card={{ color: 'blue', value: 'skip' }} w={48} /><View style={{ marginLeft: -14, transform: [{ rotate: '10deg' }] }}><UnoCard card={{ color: 'yellow', value: 'draw2' }} w={48} /></View></View><Text style={s.heroTitle}>UNO</Text><Text style={[s.heroSub, { textAlign: 'center' }]}>Har player ko 7 cards. Upar wale card ka rang ya number milao. Jo pehle saare cards khatam kare, wo jeeta.</Text></LinearGradient><Heading title={`Players (${players.length}/4)`} /><View style={s.listCard}>{[0, 1, 2, 3].map(i => { const p = players[i]; return <View key={i} style={[s.msgRow, i === 3 && { borderBottomWidth: 0 }]}>{p ? <Photo uri={p.photo} name={p.name} size={44} /> : <View style={s.emptySlot}><Ionicons name="person-add-outline" size={20} color={c.faint} /></View>}<View style={{ flex: 1 }}><Text style={s.menuText}>{p ? (p.id === user?.id ? 'You' : p.name) : 'Waiting for player...'}</Text>{p && <Text style={s.tiny}>{p.bot ? 'Computer player' : p.id === game.hostId ? 'Host' : 'Player'}</Text>}</View></View>; })}</View>{!inGame && players.length < 4 && <Button title="Join game" disabled={busy} onPress={() => unoAct('uno-join')} />}{isHost && players.length < 4 && <Button title="Add computer player" soft disabled={busy} onPress={() => unoAct('uno-bot')} />}{isHost ? <Button title={players.length >= 2 ? 'Start game' : 'Kam se kam 2 players chahiye'} disabled={busy || players.length < 2} onPress={() => unoAct('uno-start')} /> : <Text style={[s.small, { textAlign: 'center' }]}>Host game shuru karega.</Text>}</View>
    : <View style={{ gap: 12 }}>
      <View style={s.ludoPlayers}>{players.filter(p => p.id !== user?.id).map(p => { const on = game.turn === p.id && game.status === 'playing'; const n = game.counts?.[p.id] ?? 0; return <View key={p.id} style={[s.ludoChip, { borderColor: on ? c.brand : 'transparent', backgroundColor: on ? '#FFE8F0' : 'white' }]}><Photo uri={p.photo} name={p.name} size={36} /><View style={{ flexShrink: 1 }}><Text style={s.ludoChipName} numberOfLines={1}>{p.bot ? p.name : firstName(p.name)}</Text><Text style={[s.tiny, n === 1 && { color: c.red, fontWeight: '900' }]}>{n === 1 ? 'UNO! 1 card' : `${n} cards`}</Text></View></View>; })}</View>
      <LinearGradient colors={['#0F5132', '#0B3D26']} style={s.unoTable}>
        <View style={[s.row, { gap: 26, justifyContent: 'center' }]}>
          <Pressable accessibilityLabel="Draw a card" disabled={!myTurn || game.phase !== 'play' || busy} onPress={() => unoAct('uno-draw')} style={{ alignItems: 'center', gap: 6 }}><UnoCard w={70} /><Text style={s.unoLabel}>{myTurn && game.phase === 'play' ? 'Tap to draw' : `${game.deckCount ?? ''} left`}</Text></Pressable>
          <View style={{ alignItems: 'center', gap: 6 }}><UnoCard card={game.top} w={78} /><View style={s.row}><View style={[s.colorDot, { backgroundColor: UNO_COL[game.color] || '#999' }]} /><Ionicons name={game.direction === -1 ? 'arrow-undo' : 'arrow-redo'} size={18} color="white" /></View></View>
        </View>
        <Text style={s.unoStatus}>{game.status === 'finished' ? (game.winnerId === user?.id ? 'Aap jeet gaye!' : `${winner?.name || 'Player'} jeet gaye!`) : myTurn ? (game.phase === 'drawn' ? 'Nikla card chal sakte ho, ya Pass karo' : (unoHand.playable || []).length ? 'Aapki baari. Card chuno.' : 'Koi card match nahi. Deck se card lo.') : `${turnP?.name || 'Player'} ki baari`}</Text>
        {!!game.log?.[0] && <Text style={s.unoLog}>{game.log[0]}</Text>}
      </LinearGradient>
      {pickColor && <View style={s.colorPick}><Text style={s.cardTitle}>Rang chuno</Text><View style={[s.row, { gap: 12 }]}>{['red', 'yellow', 'green', 'blue'].map(col => <Pressable key={col} accessibilityLabel={col} onPress={() => unoAct('uno-play', { card: pickColor, color: col })} style={[s.colorBig, { backgroundColor: UNO_COL[col] }]} />)}</View><Pressable onPress={() => setPickColor(null)}><Text style={s.link}>Cancel</Text></Pressable></View>}
      {inGame && <><Text style={s.label}>Your cards ({unoHand.cards?.length || 0})</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 14, paddingBottom: 6, paddingRight: 10 }}>{(unoHand.cards || []).map((cd: Item) => { const ok = (unoHand.playable || []).includes(cd.id); return <Pressable key={cd.id} accessibilityLabel={`${cd.color} ${cd.value}`} disabled={!ok || busy} onPress={() => { if (cd.color === 'wild') setPickColor(cd.id); else unoAct('uno-play', { card: cd.id }); }}><UnoCard card={cd} w={62} lifted={ok} dim={myTurn && !ok} /></Pressable>; })}</ScrollView></>}
      {myTurn && game.phase === 'drawn' && <Button title="Pass" soft disabled={busy} onPress={() => unoAct('uno-pass')} />}
      {game.log?.length > 1 && <View style={s.infoBox}>{game.log.slice(1, 4).map((l: string, k: number) => <Text key={k} style={s.small}>{l}</Text>)}</View>}
      {game.status === 'finished' && <Button title="New game" onPress={() => act(async () => { setGame(await api('/games/uno', 'POST', { roomId: game.roomId })); })} />}
    </View>; }
  if (page === 'game' && game && game.type !== 'ludo' && game.type !== 'uno') detail = <View style={s.form}><Text style={s.sectionTitle}>{game.players?.map((p: Item) => p.name).join('  vs  ')}</Text><View style={s.statusPill}><Text style={s.statusText}>{game.status === 'waiting' ? 'Dusre player ka wait ho raha hai' : game.status === 'finished' ? game.winnerId === user?.id ? 'Aap jeet gaye!' : 'Game over. Achha khela!' : game.status === 'draw' ? 'Draw!' : game.turn === user?.id ? 'Aapki baari' : 'Dusre player ki baari'}</Text></View>{game.type === 'connect-four' ? <View style={s.c4Board}>{game.board?.map((mark: string | null, index: number) => <Pressable key={index} accessibilityLabel={`Column ${(index % 7) + 1}, ${mark ? (mark === 'R' ? 'red' : 'yellow') : 'empty'}`} disabled={busy || game.status !== 'playing' || game.turn !== user?.id} style={{ width: '12.4%', aspectRatio: 1, borderRadius: 99, backgroundColor: mark === 'R' ? c.red : mark === 'Y' ? c.gold : '#FFFFFF' }} onPress={() => act(async () => { setGame(await api(`/games/${game.id}/drop`, 'POST', { column: index % 7 })); })} />)}</View> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingVertical: 20 }}>{game.board?.map((mark: string | null, index: number) => <Pressable key={index} accessibilityLabel={`Square ${index + 1}: ${mark || 'empty'}`} disabled={busy || !!mark || game.status !== 'playing' || game.turn !== user?.id} style={{ width: '29%', aspectRatio: 1, borderRadius: 20, backgroundColor: 'white', borderWidth: 2, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }} onPress={() => act(async () => { setGame(await api(`/games/${game.id}/move`, 'POST', { index })); })}><Text style={{ color: mark === 'X' ? c.brand : c.violet, fontSize: 48, fontWeight: '900' }}>{mark || ''}</Text></Pressable>)}</View>}<Button title="Refresh board" soft onPress={() => act(async () => { const games = await api('/games'); setGame(games.find((g: Item) => g.id === game.id)); })} /></View>;
  if (page === 'pk') detail = <View style={s.form}><LinearGradient colors={['#FF2E74', '#3D7BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.hero}><Text style={s.heroTitle}>PK Battle</Text><Text style={s.heroSub}>3 minute ka gift-score muqabla. Test coins only.</Text></LinearGradient>{battle ? <View style={s.card}><Text style={s.sectionTitle}>{battle.status === 'active' ? 'Battle chal raha hai' : 'Battle khatam'}</Text><Text style={s.small}>Ends at {new Date(battle.endsAt).toLocaleTimeString()}</Text>{battle.scores?.map((p: Item) => <View key={p.user.id} style={s.msgRow}><Photo uri={p.user.photo} name={p.user.name} /><Text style={[s.menuText, { flex: 1 }]}>{p.user.name}</Text><Diamond n={p.score} /></View>)}</View> : <Empty title="Koi battle nahi chal raha" note="Host kisi member ko 3 minute ke battle ke liye challenge kar sakta hai." />}{room?.ownerId === user?.id && battle?.status !== 'active' && <><Text style={s.label}>Kisko challenge karna hai?</Text><View style={s.listCard}>{room?.members?.filter((id: string) => id !== user?.id).map((id: string) => <Pressable key={id} style={s.msgRow} onPress={() => act(async () => { await api(`/rooms/${room!.id}/pk`, 'POST', { opponentId: id, durationSeconds: 180 }); setBattle(await api(`/rooms/${room!.id}/pk`)); })}><Photo uri={who(id).photo} name={who(id).name} /><Text style={[s.menuText, { flex: 1 }]}>{who(id).name}</Text><Text style={s.link}>Challenge</Text></Pressable>)}</View></>}<Button title="Refresh scores" soft onPress={() => act(async () => setBattle(await api(`/rooms/${room!.id}/pk`)))} /></View>;
  if (page === 'create-room') detail = <View style={s.form}><Text style={s.bodyMuted}>Room ka naam aur category choose karo, phir friends ko bulao.</Text><Field label="Room name" value={title} onChangeText={setTitle} placeholder="e.g. Sunday Night Adda" /><Field label="What's it about?" value={description} onChangeText={setDescription} multiline placeholder="Music, chit-chat, gaming..." /><Text style={s.label}>Category</Text><View style={s.wrap}>{['Chat', 'Chill', 'Music', 'Gaming', 'Friends'].map(cat => <Pressable key={cat} onPress={() => setFormCategory(cat)} style={[s.chip, formCategory === cat && s.chipOn]}><Text style={[s.chipText, formCategory === cat && { color: 'white' }]}>{cat}</Text></Pressable>)}</View><Button title="Start room" disabled={busy || !title.trim()} onPress={() => act(async () => { const r = await api('/rooms', 'POST', { title, description, category: formCategory }); await api(`/rooms/${r.id}/join`, 'POST', {}); setRoom(await api(`/rooms/${r.id}`)); setMessages(await api(`/rooms/${r.id}/messages`)); navigate('room'); await refresh(); })} /></View>;
  if (page === 'dm') detail = <>{dm && <Pressable style={[s.listCard, s.msgRow, { paddingHorizontal: 14, borderBottomWidth: 0 }]} onPress={() => openProfile(dm.id)}><Photo uri={dm.photo} name={dm.name} size={50} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>{dm.name}</Text><Text style={s.small}>{dm.bio || 'Tap to view profile'}</Text></View></Pressable>}{dmView}</>;
  if (page === 'wallet') detail = <><LinearGradient colors={['#FFB21C', '#FF2E74']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}><Text style={s.heroSub}>Coins balance</Text><View style={s.row}><MaterialCommunityIcons name="circle-multiple" size={34} color="white" /><Text style={[s.heroTitle, { fontSize: 40 }]}>{wallet?.coins || 0}</Text></View><View style={s.row}><MaterialCommunityIcons name="diamond-stone" size={18} color="white" /><Text style={s.heroSub}>{wallet?.diamonds || 0} diamonds received</Text></View></LinearGradient><Text style={[s.small, { marginVertical: 14 }]}>Ye test coins hain, inki koi asli keemat nahi hai. Real payment abhi band hai.</Text><Button title="Add 100 test coins" disabled={busy} onPress={() => act(async () => { await api('/wallet/demo-credit', 'POST', { amount: 100 }); setWallet(await api('/wallet')); await refresh(); setNotice('100 coins add ho gaye.'); })} /><View style={{ height: 20 }} /><Heading title="History" />{wallet?.ledger?.length ? <View style={s.listCard}>{wallet.ledger.map((l: Item, k: number) => { const plus = l.type === 'demo-credit' || l.recipientId === user?.id || l.type === 'reward'; return <View key={l.id} style={[s.msgRow, k === wallet.ledger.length - 1 && { borderBottomWidth: 0 }]}><View style={{ flex: 1 }}><Text style={s.menuText}>{l.type === 'demo-credit' ? 'Coins added' : l.type === 'gift' ? (plus ? 'Gift received' : 'Gift sent') : l.type || l.kind || 'Transaction'}</Text><Text style={s.tiny}>{l.createdAt ? ago(l.createdAt) : ''}</Text></View><Text style={[s.amount, { color: plus ? c.teal : c.brand }]}>{plus ? '+' : '-'}{l.amount ?? l.coins ?? l.cost ?? ''}</Text></View>; })}</View> : <Empty title="Koi transaction nahi" note="Aapki coin history yahan dikhegi." />}</>;
  if (page === 'gifts') detail = <><Text style={s.bodyMuted}>Kisi ka din bana do, ek gift bhejo.</Text><View style={s.giftGridLight}>{catalog.gifts?.map(g => <Pressable key={g.id} style={[s.giftLight, selectedGift?.id === g.id && { borderColor: c.brand }]} onPress={() => setSelectedGift(g)}><GiftArt id={g.id} size={60} /><Text style={s.cardTitle}>{g.name}</Text><Coin n={g.cost} /></Pressable>)}</View>{selectedGift && <View style={s.form}><Field label="Recipient user ID" value={recipient} onChangeText={setRecipient} placeholder="Profile kholkar gift bhejo" /><Button title={`Send ${selectedGift.name} · ${selectedGift.cost} coins`} disabled={busy || !recipient} onPress={() => act(async () => { await api('/gifts/send', 'POST', { giftId: selectedGift.id, recipientId: recipient, quantity: 1, idempotencyKey: giftRequestKey(selectedGift.id, recipient) }); await refresh(); giftKeyRef.current = null; setSelectedGift(null); setNotice('Gift bhej diya.'); })} /></View>}</>;
  if (page === 'families') detail = <><Text style={s.bodyMuted}>Apni gang dhoondo, ya khud banao.</Text>{catalog.families?.map(f => { const inIt = f.members?.includes(user?.id); return <View key={f.id} style={s.card}><View style={s.row}><Photo uri={f.cover} name={f.name} size={58} radius={16} /><View style={{ flex: 1, gap: 2 }}><Text style={s.cardTitle}>{f.name}</Text><Text style={s.small}>{f.members?.length || 0} members</Text></View><Button small soft={inIt} title={inIt ? 'Leave' : 'Join'} onPress={() => act(async () => { await api(`/families/${f.id}/join`, inIt ? 'DELETE' : 'POST', {}); const data = await api('/families'); setCatalog(prev => ({ ...prev, families: data })); })} /></View><Text style={[s.body, { marginTop: 12 }]}>{f.description}</Text></View>; })}<View style={[s.card, { gap: 14 }]}><Text style={s.sectionTitle}>Nayi family banao</Text><Field label="Family name" value={title} onChangeText={setTitle} /><Field label="Description" value={description} onChangeText={setDescription} /><Button title="Create family" disabled={!title.trim() || busy} onPress={() => act(async () => { await api('/families', 'POST', { name: title, description }); const data = await api('/families'); setCatalog(prev => ({ ...prev, families: data })); setTitle(''); setNotice('Family ban gayi.'); })} /></View></>;
  if (page === 'events') detail = <>{catalog.events?.map((e, i) => { const joined = (e.attendees || e.rsvps || []).includes(user?.id); return <View key={e.id} style={s.card}><LinearGradient colors={banners[i % 3].colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.eventArt}><Photo uri={e.cover} name={e.title} size={64} ring ringColors={['#FFFFFF', '#FFE08A']} /><View style={{ flex: 1, gap: 4 }}><Text style={s.eventDate}>{when(e.startsAt || e.startAt)}</Text><Text style={s.eventTitle}>{e.title}</Text></View></LinearGradient><Text style={[s.body, { marginVertical: 12 }]}>{e.description}</Text><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.small}>{(e.attendees || e.rsvps || []).length} going</Text><Button small soft={joined} title={joined ? 'Going' : 'Join'} onPress={() => act(async () => { await api(`/events/${e.id}/rsvp`, joined ? 'DELETE' : 'POST', {}); const data = await api('/events'); setCatalog(prev => ({ ...prev, events: data })); setNotice(joined ? 'RSVP cancel ho gaya.' : 'Done! Aapka naam list mein hai.'); })} /></View></View>; })}{!catalog.events?.length && <Empty title="Abhi koi event nahi" note="Naye events jald aayenge." />}</>;
  if (page === 'tasks') detail = <><LinearGradient colors={['#00B89C', '#3D7BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}><Text style={s.heroTitle}>Daily rewards</Text><Text style={s.heroSub}>Roz ke chhote kaam karo, coins kamao.</Text></LinearGradient><View style={[s.listCard, { marginTop: 14 }]}>{catalog.tasks?.map((t, k) => <View key={t.id} style={[s.msgRow, k === (catalog.tasks?.length || 0) - 1 && { borderBottomWidth: 0 }]}><View style={{ flex: 1, gap: 4 }}><Text style={s.menuText}>{t.title}</Text><Coin n={`+${t.reward}`} size={14} /></View><Button small soft={!t.ready || t.claimed} title={t.claimed ? 'Done' : t.ready ? 'Claim' : 'Go'} disabled={busy || t.claimed || !t.ready} onPress={() => act(async () => { await api(`/tasks/${t.id}/claim`, 'POST', {}); const data = await api('/tasks'); setCatalog(prev => ({ ...prev, tasks: data })); await refresh(); setNotice('Reward mil gaya.'); })} /></View>)}</View></>;
  if (page === 'leaderboard') { const list = catalog.leaderboard || []; const top = list.slice(0, 3); const order = [top[1], top[0], top[2]]; detail = <><LinearGradient colors={['#FFC23C', '#FF7A1A', '#FF2E74']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.podium}><Text style={s.podiumTitle}>Weekly stars</Text><Text style={s.podiumSub}>Most diamonds received this week</Text><View style={s.podiumRow}>{order.map((r, k) => r ? <Pressable key={r.user.id} style={[s.podiumItem, k === 1 && { marginTop: -20 }]} onPress={() => openProfile(r.user.id)}>{k === 1 && <MaterialCommunityIcons name="crown" size={28} color="#FFF3B0" />}<Photo uri={r.user.photo} name={r.user.name} size={k === 1 ? 78 : 62} ring ringColors={k === 1 ? ['#FFF3B0', '#FFD54A'] : ['#FFFFFF', '#E5E7EB']} /><Text style={s.podiumName}>{firstName(r.user.name)}</Text><View style={s.podiumScore}><Diamond n={r.diamonds} size={13} dark /></View><Text style={s.podiumRank}>{k === 1 ? '1st' : k === 0 ? '2nd' : '3rd'}</Text></Pressable> : <View key={k} style={s.podiumItem} />)}</View></LinearGradient><View style={s.listCard}>{list.slice(3).map((r, i) => <Pressable key={r.user.id} style={s.msgRow} onPress={() => openProfile(r.user.id)}><Text style={s.rankNum}>{r.rank || i + 4}</Text><Photo uri={r.user.photo} name={r.user.name} size={44} /><View style={{ flex: 1, gap: 3 }}><Text style={s.menuText}>{r.user.name}</Text><Level level={r.user.level} gender={r.user.gender} /></View><Diamond n={r.diamonds} /></Pressable>)}</View></>; }
  if (page === 'vip' || page === 'store') detail = <><LinearGradient colors={['#2B0A55', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, { alignItems: 'center' }]}><MaterialCommunityIcons name="crown" size={52} color={c.gold} /><Text style={s.heroTitle}>Party VIP</Text><Text style={[s.heroSub, { textAlign: 'center' }]}>Special badge, entry effects and a golden name in chat.</Text></LinearGradient>{catalog[page]?.map((v, i) => <View key={v.id || i} style={s.card}><Text style={s.cardTitle}>{v.name || v.title}</Text><Text style={[s.body, { marginTop: 6 }]}>{v.description || (v.benefits || []).join(' · ')}</Text></View>)}<View style={s.infoBox}><Text style={s.small}>VIP kharidna abhi band hai. Payment system lagne ke baad chalu hoga.</Text></View></>;
  if (page === 'edit-profile') detail = <View style={s.form}><View style={{ alignItems: 'center', gap: 10 }}><Pressable onPress={pickPhoto}><Photo uri={user?.photo} name={name || user?.name} size={96} ring /><View style={s.camBadge}><Ionicons name="camera" size={16} color="white" /></View></Pressable><Pressable onPress={pickPhoto}><Text style={s.link}>{user?.photo ? 'Change photo' : 'Add profile photo'}</Text></Pressable></View><Field label="Your name" value={name} onChangeText={setName} /><Field label="Bio" value={description} onChangeText={setDescription} multiline placeholder="Apne baare mein kuch likho..." /><Text style={s.label}>Gender</Text><View style={s.wrap}>{[['male', 'Male'], ['female', 'Female']].map(([v, l]) => <Pressable key={v} onPress={() => setGender(v)} style={[s.chip, gender === v && s.chipOn]}><Text style={[s.chipText, gender === v && { color: 'white' }]}>{l}</Text></Pressable>)}</View><Field label="Hometown" value={hometown} onChangeText={setHometown} placeholder="e.g. Varanasi" /><Field label="Birthday (YYYY-MM-DD)" value={birthday} onChangeText={setBirthday} placeholder="2001-04-12" /><Field label="Interests (comma se alag karo)" value={tagsText} onChangeText={setTagsText} placeholder="Music, Cricket, Shayari" /><Button title="Save profile" disabled={busy || !name.trim()} onPress={() => act(async () => { if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) throw new Error('Birthday is format mein likho: 2001-04-12'); await api('/me', 'PATCH', { name, bio: description, hometown, birthday, ...(gender ? { gender } : {}), tags: tagsText.split(',').map(t => t.trim()).filter(Boolean).slice(0, 6) }); await refresh(); navigate(''); setNotice('Profile save ho gayi.'); })} /></View>;
  if (page === 'user' && profile) { const isF = following.includes(profile.id); const inR = rooms.find(rr => rr.members?.includes(profile.id)); detail = <><LinearGradient colors={['#FF2E74', '#8B3DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, { alignItems: 'center' }]}><Photo uri={profile.photo} name={profile.name} size={92} ring ringColors={['#FFFFFF', '#FFE08A']} /><View style={[s.row, { marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }]}><Text style={s.heroTitle}>{profile.name}</Text><Level level={profile.level} gender={profile.gender} /></View><Text style={s.meId}>ID: {shortId(profile.id)}</Text><Text style={[s.heroSub, { textAlign: 'center' }]}>{profile.bio || 'Hey there!'}</Text><View style={[s.row, { gap: 26, marginTop: 8 }]}><View style={{ alignItems: 'center' }}><Text style={s.heroStat}>{profile.followers?.length ?? 0}</Text><Text style={s.heroSub}>Followers</Text></View><View style={{ alignItems: 'center' }}><Text style={s.heroStat}>{profile.following?.length ?? 0}</Text><Text style={s.heroSub}>Following</Text></View></View></LinearGradient><View style={[s.row, { gap: 10, marginVertical: 14 }]}><View style={{ flex: 1 }}><Button title={isF ? 'Following' : 'Follow'} soft={isF} onPress={() => toggleFollow(profile.id)} /></View><View style={{ flex: 1 }}><Button title="Message" soft onPress={() => openDm(profile)} /></View></View>{inR && <Pressable style={[s.listCard, s.msgRow, { paddingHorizontal: 14, borderBottomWidth: 0 }]} onPress={() => enterRoom(inR)}><Photo uri={inR.cover} name={inR.title} size={48} radius={12} /><View style={{ flex: 1 }}><Text style={s.tiny}>In room now</Text><Text style={s.menuText}>{inR.title}</Text></View><Text style={s.link}>Join</Text></Pressable>}<View style={[s.card, { marginTop: 10 }]}><Text style={[s.cardTitle, { marginBottom: 10 }]}>About</Text>{aboutRows(profile)}</View><Text style={[s.sectionTitle, { marginTop: 8, marginBottom: 8 }]}>Honor</Text>{honorGrid}{isMod && room?.members?.includes(profile.id) && profile.id !== room.ownerId && <View style={[s.card, { gap: 10, marginTop: 10 }]}><Text style={s.cardTitle}>Room controls</Text>{room.ownerId === user?.id && <Button small soft title={(room.admins || []).includes(profile.id) ? 'Remove admin' : 'Make admin'} onPress={() => act(async () => { setRoom(await api(`/rooms/${room.id}/admins`, 'POST', { userId: profile.id, admin: !(room.admins || []).includes(profile.id) })); setNotice('Done.'); })} />}{(() => { const seat = room.seats?.find((x: Item) => x.userId === profile.id); return seat ? <><Button small soft title={seat.muted ? 'Unmute mic' : 'Mute mic'} onPress={() => seatAction(seat.index, seat.muted ? 'unmute' : 'mute')} /><Button small soft title="Remove from seat" onPress={() => seatAction(seat.index, 'leave')} /></> : null; })()}<Button small soft title="Remove from room" onPress={() => act(async () => { await api(`/rooms/${room.id}/kick`, 'POST', { userId: profile.id }); setRoom(await api(`/rooms/${room.id}`)); navigate('room'); })} /></View>}<View style={[s.card, { gap: 12, marginTop: 10 }]}><Text style={s.cardTitle}>Safety</Text><Field label="Report reason" value={description} onChangeText={setDescription} multiline placeholder="Kya problem hui? Batao." /><Button title="Submit report" small soft disabled={busy || !description.trim()} onPress={() => act(async () => { await api('/reports', 'POST', { targetType: 'user', targetId: profile.id, reason: description }); setDescription(''); setNotice('Report mil gayi. Hum check karenge.'); })} /><Button title="Block this person" small soft onPress={() => act(async () => { await api(`/users/${profile.id}/block`, 'POST', {}); setNotice('Block kar diya.'); goHome(); })} /></View></>; }
  if (page === 'comments' && post) detail = <><View style={s.post}><View style={s.row}><Photo uri={post.author?.photo} name={post.author?.name} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>{post.author?.name}</Text><Text style={s.tiny}>{ago(post.createdAt)}</Text></View></View><Text style={[s.body, { marginTop: 12 }]}>{post.text}</Text></View><Heading title={`${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`} />{comments.map(cm => <View key={cm.id} style={[s.row, { alignItems: 'flex-start', marginBottom: 14 }]}><Photo uri={cm.author?.photo} name={cm.author?.name} size={38} /><View style={[s.bubble, { flex: 1 }]}><Text style={s.chatAuthorLight}>{cm.author?.name || 'Member'}</Text><Text style={s.body}>{cm.text}</Text><Text style={s.bubbleTime}>{ago(cm.createdAt)}</Text></View></View>)}<View style={s.composer}><TextInput accessibilityLabel="Your comment" placeholder="Write a comment..." placeholderTextColor={c.faint} value={text} onChangeText={setText} style={s.composerInput} /><Pressable accessibilityLabel="Post comment" disabled={busy || !text.trim()} onPress={() => act(async () => { await api(`/posts/${post.id}/comments`, 'POST', { text }); setComments(await api(`/posts/${post.id}/comments`)); setText(''); await refresh(); })}><LinearGradient colors={brand} style={[s.sendBtn, !text.trim() && { opacity: .5 }]}><Ionicons name="send" size={18} color="white" /></LinearGradient></Pressable></View></>;
  if (page === 'queue' && room) detail = <View style={s.form}><Text style={s.bodyMuted}>Bolna hai? Queue mein aao, host aapko khali seat pe bula lega.</Text>{(() => { const inQueue = queue.some(x => x.id === user?.id); const seated = !!currentSeat; return <Button title={seated ? 'Aapke paas seat hai' : inQueue ? 'Leave queue' : 'Raise hand'} disabled={busy || seated} onPress={() => act(async () => { setQueue(await api(`/rooms/${room.id}/queue`, 'POST', { action: inQueue ? 'leave' : 'join' })); })} />; })()}{queue.length === 0 && <Empty title="Queue khali hai" note="Sabse pehle haath uthao." />}{queue.length > 0 && <View style={s.listCard}>{queue.map((qq, i) => <View key={qq.id} style={s.msgRow}><Text style={s.rankNum}>{i + 1}</Text><Photo uri={qq.photo} name={qq.name} size={42} /><Text style={[s.menuText, { flex: 1 }]}>{qq.name}</Text>{room.ownerId === user?.id && <Button small title="Invite" soft disabled={busy} onPress={() => act(async () => { await api(`/rooms/${room.id}/queue/promote`, 'POST', { userId: qq.id }); setQueue(await api(`/rooms/${room.id}/queue`)); setRoom(await api(`/rooms/${room.id}`)); })} />}</View>)}</View>}</View>;
  if (page === 'lucky' && room) detail = <View style={s.form}><LinearGradient colors={['#E5484D', '#FF9F1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}><Text style={s.heroTitle}>Lucky bag</Text><Text style={s.heroSub}>Room mein sabke saath coins baanto. Jo bacha, 24 ghante baad wapas.</Text></LinearGradient><View style={[s.card, { gap: 14 }]}><Field label="Total coins (10-10000)" value={bagTotal} onChangeText={setBagTotal} /><Field label="Kitne logon mein (2-20)" value={bagCount} onChangeText={setBagCount} /><Button title="Send lucky bag" disabled={busy} onPress={() => act(async () => { await api(`/rooms/${room.id}/lucky-bags`, 'POST', { total: Number(bagTotal), count: Number(bagCount) }); setBags(await api(`/rooms/${room.id}/lucky-bags`)); await refresh(); setNotice('Lucky bag bhej diya.'); })} /></View>{bags.length > 0 && <View style={s.listCard}>{bags.map(bg => <View key={bg.id} style={s.msgRow}><Photo uri={bg.sender?.photo} name={bg.sender?.name} size={44} /><View style={{ flex: 1 }}><Text style={s.menuText}>{bg.sender?.name} ka bag</Text><Text style={s.small}>{bg.total} coins · {bg.remaining} of {bg.count} left</Text>{bg.mine != null && <Text style={[s.small, { color: c.teal, fontWeight: '700' }]}>Aapko mile {bg.mine} coins</Text>}</View>{bg.mine == null && bg.sender?.id !== user?.id && bg.remaining > 0 && <Button small title="Grab" disabled={busy} onPress={() => act(async () => { const r = await api(`/lucky-bags/${bg.id}/claim`, 'POST', {}); setNotice(`Aapko ${r.amount} coins mile!`); setBags(await api(`/rooms/${room.id}/lucky-bags`)); await refresh(); })} />}</View>)}</View>}</View>;
  if (page === 'decorations') detail = <><Text style={s.bodyMuted}>Frames, entry effects aur badges. Profile ko alag dikhao.</Text><View style={s.listCard}>{catalog.decorations?.map((d, k) => <View key={d.id} style={[s.msgRow, k === (catalog.decorations?.length || 0) - 1 && { borderBottomWidth: 0 }]}><LinearGradient colors={banners[k % 3].colors} style={s.decoIcon}><MaterialCommunityIcons name={decoLook[d.slot] || 'star-circle'} size={28} color="white" /></LinearGradient><View style={{ flex: 1, gap: 3 }}><Text style={s.menuText}>{d.name}</Text><View style={s.row}><Text style={s.small}>{d.slot}</Text><Coin n={d.price} size={13} /></View></View><Button small title={d.equipped ? 'Remove' : d.owned ? 'Use' : 'Buy'} soft={d.owned} disabled={busy} onPress={() => act(async () => { const data = d.equipped ? await api(`/decorations/slot/${d.slot}`, 'DELETE', {}) : d.owned ? await api(`/decorations/${d.id}/equip`, 'POST', {}) : await api(`/decorations/${d.id}/buy`, 'POST', {}); setCatalog(prev => ({ ...prev, decorations: data.items })); await refresh(); })} /></View>)}</View></>;
  if (page === 'settings') detail = <View style={s.form}><View style={s.listCard}><Pressable style={s.msgRow} onPress={() => { openEdit(); }}><Text style={[s.menuText, { flex: 1 }]}>Edit profile</Text><Ionicons name="chevron-forward" size={18} color={c.faint} /></Pressable><Pressable style={s.msgRow} onPress={openWallet}><Text style={[s.menuText, { flex: 1 }]}>Wallet</Text><Ionicons name="chevron-forward" size={18} color={c.faint} /></Pressable><Pressable style={s.msgRow} onPress={() => loadCatalog('decorations')}><Text style={[s.menuText, { flex: 1 }]}>Style shop</Text><Ionicons name="chevron-forward" size={18} color={c.faint} /></Pressable><View style={[s.msgRow, { borderBottomWidth: 0 }]}><Text style={[s.menuText, { flex: 1 }]}>Connection</Text><View style={[s.onlineDotInline, { backgroundColor: connected ? c.teal : c.red }]} /><Text style={s.small}>{connected ? 'Online' : 'Offline'}</Text><Pressable onPress={() => { setRetry(x => x + 1); refresh(); }}><Text style={s.link}>Retry</Text></Pressable></View></View><View style={[s.card, { gap: 14 }]}><Text style={s.cardTitle}>Account security</Text><Field label="Current password" value={password} onChangeText={setPassword} secure /><Field label="New password (min 8 characters)" value={newPassword} onChangeText={setNewPassword} secure /><Button title="Change password" soft disabled={busy || !password || newPassword.length < 8} onPress={() => act(async () => { await api('/me/password', 'POST', { currentPassword: password, newPassword }); setPassword(''); setNewPassword(''); setNotice('Password badal gaya. Baaki devices se logout ho gaye.'); })} /><Button title="Download my data" soft onPress={() => act(async () => { const d = await api('/me/export'); setNotice(`Data ready: ${d.messages.length} messages, ${d.posts.length} posts, ${d.ledger.length} wallet records.`); })} />{deleteArmed ? <><Text style={s.small}>Isse aapki profile hamesha ke liye delete ho jayegi. Upar password daalo, phir confirm karo.</Text><Button title="Yes, delete my account" disabled={busy || (!user?.demo && !password)} onPress={() => act(async () => { await api('/me', 'DELETE', { password }); await AsyncStorage.removeItem('melo-session'); socket.current?.disconnect(); setToken(''); setUser(null); setRoom(null); setDm(null); setMessages([]); setPage(''); setPassword(''); setDeleteArmed(false); setNotice('Account delete ho gaya.'); })} /><Button title="No, keep it" soft onPress={() => setDeleteArmed(false)} /></> : <Button title="Delete account" soft onPress={() => setDeleteArmed(true)} />}</View><View style={s.infoBox}><Text style={s.small}>Kisi ke saath password ya personal details share mat karo. Koi pareshan kare to uski profile se block ya report karo.</Text></View><Button title="Log out" onPress={() => act(async () => { await api('/auth/logout', 'POST', {}); await AsyncStorage.removeItem('melo-session'); socket.current?.disconnect(); setToken(''); setUser(null); setRoom(null); setDm(null); setMessages([]); setPage(''); })} /><Text style={[s.tiny, { textAlign: 'center' }]}>Party App · version 0.2.0</Text></View>;

  if (page === 'notifications') detail = <View style={s.listCard}>{notifs.map((n, k) => <Pressable key={n.id} style={[s.msgRow, k === notifs.length - 1 && { borderBottomWidth: 0 }]} onPress={() => n.fromId && openProfile(n.fromId)}><View><Photo uri={n.from?.photo} name={n.from?.name} size={48} /><View style={[s.notifIcon, { backgroundColor: n.type === 'gift' ? c.mango : n.type === 'comment' ? c.blue : n.type === 'admin' ? c.teal : c.brand }]}><Ionicons name={n.type === 'gift' ? 'gift' : n.type === 'comment' ? 'chatbubble' : n.type === 'admin' ? 'shield-checkmark' : 'person-add'} size={11} color="white" /></View></View><View style={{ flex: 1, gap: 3 }}><Text style={[s.body, !n.read && { fontWeight: '800' }]}>{n.text}</Text><Text style={s.tiny}>{ago(n.at)}</Text></View></Pressable>)}{!notifs.length && <Empty title="Koi notification nahi" note="Follow, gifts aur comments yahan dikhenge." />}</View>;
  if (page === 'visitors') detail = <>{visitors.length ? <View style={s.listCard}>{visitors.map((v, k) => { const isF = following.includes(v.user.id); return <Pressable key={v.user.id} style={[s.msgRow, k === visitors.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openProfile(v.user.id)}><Photo uri={v.user.photo} name={v.user.name} size={50} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { flexWrap: 'wrap' }]}><Text style={s.cardTitle}>{v.user.name}</Text><Level level={v.user.level} gender={v.user.gender} /></View><Text style={s.tiny}>Visited {ago(v.at)}</Text></View><Pressable onPress={() => toggleFollow(v.user.id)} style={[s.followBtn, isF && s.followingBtn]}><Text style={[s.followText, isF && { color: c.muted }]}>{isF ? 'Following' : 'Follow back'}</Text></Pressable></Pressable>; })}</View> : <Empty title="Abhi koi visitor nahi" note="Room join karo aur logon se baat karo, log aapki profile dekhne aayenge." />}</>;
  if (page === 'strangers') detail = <><Text style={s.bodyMuted}>Jinhe aap follow nahi karte, unke messages yahan aate hain.</Text><View style={s.listCard}>{strangerConvs.map((cv, k) => <Pressable key={cv.user.id} style={[s.msgRow, k === strangerConvs.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openDm(cv.user)}><Photo uri={cv.user.photo} name={cv.user.name} size={50} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.cardTitle, { flex: 1 }]}>{cv.user.name}</Text><Text style={s.tiny}>{ago(cv.lastMessage?.createdAt)}</Text></View><Text style={s.small}>{cv.lastMessage?.text}</Text></View></Pressable>)}</View>{!strangerConvs.length && <Empty title="Koi stranger message nahi" note="" />}</>;
  const titles: Record<string, string> = { notifications: 'Notifications', visitors: 'Visitors', strangers: 'Stranger messages', 'join-locked': 'Private room', 'room-settings': 'Room settings', 'create-room': 'Start a room', dm: dm?.name || 'Chat', games: 'Games', game: game?.type === 'uno' ? 'UNO' : game?.type === 'ludo' ? 'Ludo' : game?.type === 'connect-four' ? 'Connect Four' : 'Tic-tac-toe', pk: 'PK battle', wallet: 'Wallet', gifts: 'Send a gift', families: 'Families', events: 'Events', tasks: 'Daily rewards', leaderboard: 'Rankings', vip: 'VIP', store: 'Store', 'edit-profile': 'Edit profile', settings: 'Settings', decorations: 'Style shop', lucky: 'Lucky bag', queue: 'Mic queue', user: 'Profile', comments: 'Comments' };
  const navTabs = [{ name: 'Party', icon: 'home-outline', active: 'home' }, { name: 'Explore', icon: 'compass-outline', active: 'compass' }, { name: '+', icon: 'add', active: 'add' }, { name: 'Messages', icon: 'chatbubble-ellipses-outline', active: 'chatbubble-ellipses' }, { name: 'Me', icon: 'person-outline', active: 'person' }] as const;
  const statusBars = <>{!connected && <Pressable accessibilityRole="button" onPress={() => { setRetry(x => x + 1); refresh(); }} style={s.connection}><Ionicons name="cloud-offline" size={18} color="#9A5B00" /><Text style={s.connectionText}>Connecting to server... tap to retry</Text></Pressable>}
    {!!error && <View style={s.errorBar}><Ionicons name="alert-circle" size={20} color={c.red} /><Text accessibilityRole="alert" style={[s.error, { flex: 1 }]}>{error}</Text><Pressable accessibilityLabel="Dismiss error" onPress={() => setError('')}><Ionicons name="close" size={22} color={c.red} /></Pressable></View>}
    {!!notice && <View accessibilityLiveRegion="polite" style={s.notice}><Ionicons name="checkmark-circle" color={c.teal} size={20} /><Text style={s.noticeText}>{notice}</Text></View>}
    {busy && <View style={s.progress}><ActivityIndicator size="small" color={c.brand} /></View>}</>;

  const mainHeader = tab === 'Party' ? <View style={[s.header, { paddingTop: insets.top + 10 }]}><View style={[s.row, { justifyContent: 'space-between' }]}><Tabs big items={['Popular', 'Following']} value={homeTab} onChange={setHomeTab} /><View style={[s.row, { gap: 16 }]}><Pressable accessibilityLabel="Rankings" onPress={() => loadCatalog('leaderboard')}><LinearGradient colors={['#FFC23C', '#FF7A1A']} style={s.headerBadge}><MaterialCommunityIcons name="crown" size={19} color="white" /></LinearGradient></Pressable><Pressable accessibilityLabel="Wallet" onPress={openWallet}><Ionicons name="wallet-outline" size={25} color={c.ink} /></Pressable><Pressable accessibilityLabel="Refresh" onPress={refresh}><Ionicons name="refresh" size={24} color={c.ink} /></Pressable></View></View><View style={s.search}><Ionicons name="search" color={c.faint} size={19} /><TextInput accessibilityLabel="Search rooms" placeholder="Search rooms or room ID" placeholderTextColor={c.faint} value={q} onChangeText={setQ} style={s.searchInput} /></View></View>
    : tab === 'Explore' ? <View style={[s.header, { paddingTop: insets.top + 10 }]}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.bigTitle}>Explore</Text><Pressable accessibilityLabel="Refresh" onPress={refresh}><Ionicons name="refresh" size={24} color={c.ink} /></Pressable></View><Tabs items={['Square', 'People']} value={exploreTab} onChange={setExploreTab} /></View>
    : tab === 'Messages' ? <View style={[s.header, { paddingTop: insets.top + 10, paddingBottom: 12 }]}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.bigTitle}>Messages</Text><View style={[s.row, { gap: 16 }]}><Pressable accessibilityLabel="Notifications" onPress={() => act(async () => { setNotifs(await api('/me/notifications')); navigate('notifications'); if (notifUnread) { api('/me/notifications/read', 'POST', {}).catch(() => {}); setNotifUnread(0); } })}><Ionicons name="notifications-outline" size={25} color={c.ink} />{notifUnread > 0 && <View style={s.navBadge}><Text style={s.navBadgeText}>{notifUnread}</Text></View>}</Pressable><Pressable accessibilityLabel="Refresh" onPress={refresh}><Ionicons name="refresh" size={24} color={c.ink} /></Pressable></View></View></View> : null;

  const inRoom = !!(token && page === 'room' && room);
  return <View style={s.outer}><StatusBar style={inRoom || (token && !page && tab === 'Me') ? 'light' : 'dark'} /><View style={[s.shell, inRoom && { backgroundColor: '#0E0726' }]}>{!token ? authScreen : inRoom ? roomScreen : <>
    {page ? <View style={[s.appBar, { paddingTop: insets.top + 6 }]}><Pressable accessibilityLabel="Go back" onPress={back} style={s.back}><Ionicons name="chevron-back" size={26} color={c.ink} /></Pressable><Text style={s.barTitle} numberOfLines={1}>{titles[page]}</Text><View style={{ width: 42 }} /></View> : mainHeader}
    {statusBars}
    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={[!page && tab === 'Me' ? { paddingBottom: 30 } : s.content, !!page && { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">{loading && !page && tab === 'Party' && !rooms.length && <ActivityIndicator style={{ marginVertical: 25 }} color={c.brand} />}{page ? detail : tab === 'Party' ? homeScreen : tab === 'Explore' ? exploreScreen : tab === 'Messages' ? messagesScreen : meScreen}</ScrollView>
    {room && <Pressable accessibilityLabel="Back to room" onPress={() => navigate('room')} style={[s.floatRoom, { bottom: page ? insets.bottom + 20 : Math.max(insets.bottom, 8) + 78 }]}><Photo uri={room.cover} name={room.title} size={50} radius={14} /><View style={s.floatEq}><MaterialCommunityIcons name="equalizer" size={14} color="white" /></View><Pressable accessibilityLabel="Leave room" onPress={leaveRoom} style={s.floatClose}><Ionicons name="close" size={14} color="white" /></Pressable></Pressable>}
    {!page && <View style={[s.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>{navTabs.map(t => { if (t.name === '+') return <Pressable key="+" accessibilityLabel="Start a room" style={s.navItem} onPress={() => { setTitle(''); setDescription(''); navigate('create-room'); }}><LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.navPlus}><Ionicons name="add" size={30} color="white" /></LinearGradient></Pressable>; const on = tab === t.name; return <Pressable accessibilityRole="tab" accessibilityLabel={t.name} accessibilityState={{ selected: on }} key={t.name} style={s.navItem} onPress={() => { setTab(t.name); setText(''); }}><View><Ionicons name={on ? t.active : t.icon} size={26} color={on ? c.brand : '#4B4763'} />{t.name === 'Messages' && unread > 0 && <View style={s.navBadge}><Text style={s.navBadgeText}>{unread}</Text></View>}</View><Text style={[s.navLabel, on && { color: c.brand, fontWeight: '800' }]}>{t.name}</Text></Pressable>; })}</View>}
  </>}</View>{Platform.OS === 'web' && width > 1060 && <View style={s.desktopNote}><Text style={s.desktopLogo}>Party App</Text><Text style={s.desktopText}>Live voice rooms.{'\n'}Real people.</Text></View>}</View>;
}

const shadow = Platform.select({ web: { boxShadow: '0 4px 16px rgba(40,20,90,0.07)' } as any, default: { shadowColor: '#2A1660', shadowOpacity: .08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 } });
const s = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#E9E6F2', flexDirection: 'row', justifyContent: 'center' },
  shell: { flex: 1, maxWidth: 520, backgroundColor: c.bg, overflow: 'hidden', ...Platform.select({ web: { height: '100%' as any } }) },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coinTxt: { fontWeight: '800' },
  level: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2, paddingHorizontal: 6, height: 18, borderRadius: 9 },
  levelText: { color: 'white', fontSize: 11, fontWeight: '900' },
  // typography
  bigTitle: { fontSize: 30, fontWeight: '900', color: c.ink, letterSpacing: -.5 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 8, gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: c.ink },
  cardTitle: { fontSize: 16.5, fontWeight: '800', color: c.ink },
  menuText: { fontSize: 16, fontWeight: '700', color: c.ink },
  body: { color: c.text, fontSize: 16, lineHeight: 23 },
  bodyMuted: { fontSize: 15.5, color: c.muted, lineHeight: 22, marginBottom: 6 },
  small: { fontSize: 14, color: c.muted, lineHeight: 20 },
  tiny: { fontSize: 12.5, color: c.faint, lineHeight: 17 },
  label: { fontSize: 15, color: c.ink, fontWeight: '800' },
  link: { fontSize: 15, fontWeight: '800', color: c.brand },
  // tabs and chips
  tab: { fontSize: 17, color: c.faint, fontWeight: '700' },
  tabOn: { color: c.ink, fontWeight: '900' },
  tabBig: { fontSize: 20, color: c.faint, fontWeight: '700' },
  tabBigOn: { fontSize: 26, color: c.ink, fontWeight: '900' },
  tabLine: { width: 22, height: 4, borderRadius: 2, backgroundColor: c.brand },
  chips: { gap: 8, paddingVertical: 12, paddingRight: 10 },
  chip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: 'white', borderWidth: 1, borderColor: c.line },
  chipOn: { backgroundColor: c.brand, borderColor: c.brand },
  chipText: { fontSize: 15, fontWeight: '800', color: c.text },
  // header / app bar
  header: { backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 6, gap: 10 },
  headerBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg, borderRadius: 22, paddingHorizontal: 14, gap: 8, height: 44, marginBottom: 6 },
  searchInput: { flex: 1, fontSize: 15.5, color: c.ink, paddingVertical: 8, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  appBar: { paddingHorizontal: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderColor: c.line },
  barTitle: { fontSize: 19, fontWeight: '900', color: c.ink, flex: 1, textAlign: 'center' },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, paddingBottom: 110 },
  // home
  banner: { borderRadius: 20, padding: 18, minHeight: 136, overflow: 'hidden', marginBottom: 12 },
  bannerGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: '#FFFFFF22', right: -40, top: -50 },
  bannerTitle: { color: 'white', fontSize: 22, fontWeight: '900', paddingRight: 30 },
  bannerSub: { color: '#FFFFFFE6', fontSize: 14.5, marginTop: 5, lineHeight: 20, paddingRight: 40 },
  bannerCta: { alignSelf: 'flex-start', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, marginTop: 12 },
  bannerCtaText: { color: c.ink, fontWeight: '900', fontSize: 14 },
  dots: { position: 'absolute', right: 16, bottom: 14, flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF80' },
  dotOn: { width: 16, backgroundColor: 'white' },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quick: { borderRadius: 16, paddingHorizontal: 8, paddingVertical: 10, gap: 3, minHeight: 86 },
  quickTitle: { color: 'white', fontWeight: '900', fontSize: 13 },
  quickNote: { color: '#FFFFFFD9', fontSize: 11.5 },
  roomRow: { flexDirection: 'row', gap: 12, backgroundColor: 'white', borderRadius: 18, padding: 10, marginBottom: 10, ...shadow },
  liveMini: { position: 'absolute', left: 6, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#0000008C', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  liveMiniText: { color: 'white', fontSize: 10.5, fontWeight: '900' },
  roomTitle: { fontSize: 17, fontWeight: '900', color: c.ink, lineHeight: 22 },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { color: 'white', fontSize: 12, fontWeight: '800' },
  count: { fontSize: 14.5, fontWeight: '900', color: c.ink },
  // explore
  compose: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: 'white', borderRadius: 18, padding: 10, marginBottom: 10, ...shadow },
  composeInput: { flex: 1, fontSize: 15.5, color: c.ink, backgroundColor: c.bg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  post: { backgroundColor: 'white', borderRadius: 18, padding: 14, marginBottom: 10, ...shadow },
  followBtn: { backgroundColor: c.brand, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  followingBtn: { backgroundColor: c.bg },
  followText: { color: 'white', fontWeight: '900', fontSize: 14 },
  actionText: { fontSize: 14.5, color: c.text, fontWeight: '700' },
  partyCard: { borderRadius: 22, padding: 18, marginBottom: 14, overflow: 'hidden' },
  partyCardTitle: { color: 'white', fontSize: 24, fontWeight: '900' },
  partyCardSub: { color: '#FFFFFFE0', fontSize: 14 },
  partyFaces: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, rowGap: 6 },
  faceName: { color: 'white', fontSize: 13, fontWeight: '800', marginTop: 4 },
  // lists
  listCard: { backgroundColor: 'white', borderRadius: 18, paddingHorizontal: 14, marginBottom: 10, ...shadow },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: c.line },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: 'white', borderRadius: 16, marginBottom: 8 },
  onlineDot: { position: 'absolute', right: 2, bottom: 2, width: 15, height: 15, borderRadius: 8, backgroundColor: '#22C55E', borderWidth: 2.5, borderColor: c.bg },
  onlineDotInline: { width: 9, height: 9, borderRadius: 5 },
  faceLabel: { fontSize: 13.5, color: c.ink, fontWeight: '800', textAlign: 'center' },
  sysIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: c.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '900' },
  // me
  meHead: { paddingHorizontal: 18, paddingBottom: 34, overflow: 'hidden' },
  meGlow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: '#FFFFFF1C', right: -60, top: -40 },
  glassBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF2E', alignItems: 'center', justifyContent: 'center' },
  meName: { fontSize: 24, fontWeight: '900', color: 'white' },
  meId: { fontSize: 13.5, color: '#FFFFFFD9', fontWeight: '600' },
  vipTag: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', backgroundColor: '#FFD54A', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  vipTagText: { fontSize: 12, fontWeight: '900', color: '#7A4A00' },
  meBody: { backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 14, gap: 10 },
  statsRow: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 18, paddingVertical: 14, ...shadow },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 20, fontWeight: '900', color: c.ink },
  statLabel: { fontSize: 13, color: c.muted, fontWeight: '600' },
  miniCard: { borderRadius: 16, padding: 14, gap: 3 },
  miniTitle: { fontSize: 16, fontWeight: '900', color: c.ink },
  walletCard: { backgroundColor: 'white', borderRadius: 18, padding: 14, ...shadow },
  walletTile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.bg, borderRadius: 14, padding: 12 },
  // room
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  roomTop: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  roomTopTitle: { color: 'white', fontSize: 15, fontWeight: '900', lineHeight: 19 },
  roomTopId: { color: '#FFFFFFA6', fontSize: 12 },
  onlineStack: { flexDirection: 'row', alignItems: 'center' },
  onlinePill: { marginLeft: 4, backgroundColor: '#FFFFFF26', borderRadius: 12, paddingHorizontal: 8, height: 24, justifyContent: 'center' },
  onlinePillText: { color: 'white', fontSize: 12.5, fontWeight: '900' },
  topIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF1F', alignItems: 'center', justifyContent: 'center' },
  noticeStrip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 12, backgroundColor: '#FFFFFF14', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', maxWidth: '94%' },
  noticeStripText: { color: '#FFFFFFD9', fontSize: 13, flexShrink: 1 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6, paddingTop: 14, rowGap: 8 },
  seatCell: { width: '25%', alignItems: 'center', gap: 3 },
  seatHit: { alignItems: 'center', justifyContent: 'center', width: 72, height: 72 },
  seatEmpty: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF14', borderWidth: 1.5, borderColor: '#FFFFFF33', alignItems: 'center', justifyContent: 'center' },
  seatName: { color: 'white', fontSize: 13, fontWeight: '800', maxWidth: 80, textAlign: 'center' },
  crown: { position: 'absolute', top: -4, backgroundColor: '#1A0B3B', borderRadius: 10, paddingHorizontal: 2 },
  muteBadge: { position: 'absolute', right: 4, bottom: 4, backgroundColor: c.red, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1A0B3B' },
  giftBanner: { marginHorizontal: 10, marginTop: 4, marginBottom: 4 },
  giftBannerInner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 26, paddingLeft: 4, paddingRight: 12, paddingVertical: 4 },
  gbName: { color: 'white', fontWeight: '900', fontSize: 14 },
  gbText: { color: '#FFFFFFE6', fontSize: 12.5 },
  gbQty: { color: '#FFE08A', fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
  sysMsg: { backgroundColor: '#FFFFFF14', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, alignSelf: 'flex-start', maxWidth: '92%' },
  sysMsgText: { color: '#FFD36A', fontSize: 13.5, lineHeight: 19 },
  chatLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, maxWidth: '92%' },
  chatPill: { backgroundColor: '#FFFFFF1A', borderRadius: 14, borderTopLeftRadius: 4, paddingHorizontal: 10, paddingVertical: 7, gap: 3, flexShrink: 1 },
  chatName: { color: '#9ED8FF', fontSize: 13.5, fontWeight: '800' },
  chatText: { color: 'white', fontSize: 15, lineHeight: 21 },
  roomBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingTop: 8 },
  roomInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF1F', borderRadius: 22, paddingHorizontal: 14, height: 44, gap: 6 },
  roomInputText: { flex: 1, color: 'white', fontSize: 15.5, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  roomIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF1F', alignItems: 'center', justifyContent: 'center' },
  giftFab: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  roomToast: { position: 'absolute', left: 20, right: 20, backgroundColor: '#000000CC', borderRadius: 14, padding: 12 },
  roomToastText: { color: 'white', fontSize: 14.5, textAlign: 'center', lineHeight: 20 },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#00000066' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#1C1233', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#FFFFFF40', marginBottom: 12 },
  sheetTitle: { color: 'white', fontSize: 18, fontWeight: '900', marginBottom: 14 },
  sheetLabel: { color: '#FFFFFFB3', fontSize: 14, fontWeight: '700' },
  sheetMuted: { color: '#FFFFFF99', fontSize: 14, paddingVertical: 12 },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
  toolItem: { width: '25%', alignItems: 'center', gap: 7 },
  toolIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { color: 'white', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  pickRing: { borderWidth: 2.5, borderColor: 'transparent', borderRadius: 28, padding: 2 },
  pickName: { color: '#FFFFFFB3', fontSize: 12.5, fontWeight: '700' },
  giftGrid: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 },
  giftCell: { width: '25%', alignItems: 'center', gap: 5, paddingVertical: 10, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  giftCellOn: { borderColor: c.brand, backgroundColor: '#FF2E741F' },
  giftName: { color: 'white', fontSize: 13.5, fontWeight: '800' },
  sendGift: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 22 },
  // chat (light)
  bubble: { backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 6, gap: 2, flexShrink: 1, ...shadow },
  bubbleMine: { borderBottomLeftRadius: 18, borderBottomRightRadius: 6 },
  bubbleTime: { fontSize: 11.5, color: c.faint, marginTop: 2 },
  chatAuthorLight: { fontSize: 14, color: c.violet, fontWeight: '800' },
  composer: { flexDirection: 'row', gap: 10, paddingLeft: 16, paddingRight: 6, paddingVertical: 5, backgroundColor: 'white', borderRadius: 26, alignItems: 'center', marginVertical: 12, ...shadow },
  composerInput: { flex: 1, fontSize: 15.5, color: c.ink, paddingVertical: 10, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  // generic
  button: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  buttonSmall: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '900' },
  form: { gap: 14, paddingVertical: 4 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: c.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: c.ink },
  card: { backgroundColor: 'white', padding: 14, borderRadius: 18, marginBottom: 10, ...shadow },
  hero: { borderRadius: 22, padding: 20, gap: 6, overflow: 'hidden' },
  heroTitle: { color: 'white', fontSize: 26, fontWeight: '900' },
  heroSub: { color: '#FFFFFFE6', fontSize: 15, lineHeight: 21 },
  heroStat: { color: 'white', fontSize: 20, fontWeight: '900' },
  infoBox: { backgroundColor: '#F1ECFF', borderRadius: 16, padding: 14, marginVertical: 10 },
  amount: { fontSize: 17, fontWeight: '900' },
  statusPill: { backgroundColor: '#F1ECFF', borderRadius: 16, padding: 14, alignItems: 'center' },
  statusText: { fontSize: 17, fontWeight: '800', color: c.violet, textAlign: 'center' },
  c4Board: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', padding: 10, backgroundColor: c.blue, borderRadius: 20 },
  gameTile: { borderRadius: 22, padding: 20, alignItems: 'center', gap: 10, minHeight: 140, justifyContent: 'center' },
  gameTileText: { color: 'white', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  giftGridLight: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 14 },
  giftLight: { width: '48%', borderWidth: 2, borderColor: 'transparent', borderRadius: 18, padding: 16, alignItems: 'center', gap: 8, backgroundColor: 'white', ...shadow },
  eventArt: { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventDate: { color: '#FFFFFFE6', fontSize: 13.5, fontWeight: '700' },
  eventTitle: { color: 'white', fontSize: 19, fontWeight: '900', lineHeight: 24 },
  podium: { borderRadius: 24, padding: 18, marginBottom: 12 },
  podiumTitle: { color: 'white', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  podiumSub: { color: '#FFFFFFE0', fontSize: 13.5, textAlign: 'center' },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: 30 },
  podiumItem: { alignItems: 'center', gap: 5, width: '31%' },
  podiumName: { color: 'white', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  podiumScore: { backgroundColor: '#00000033', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  podiumRank: { color: 'white', fontSize: 13, fontWeight: '900' },
  rankNum: { fontSize: 17, fontWeight: '900', color: c.faint, width: 26, textAlign: 'center' },
  decoIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 30, gap: 8, alignItems: 'center' },
  adminTag: { position: 'absolute', bottom: -2, backgroundColor: '#00B89C', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1.5, borderColor: '#1A0B3B' },
  adminTagText: { color: 'white', fontSize: 9.5, fontWeight: '900' },
  adminInline: { color: 'white', fontSize: 10.5, fontWeight: '900', backgroundColor: '#00B89C', borderRadius: 6, paddingHorizontal: 5, overflow: 'hidden' },
  themeSwatch: { width: 54, height: 54, borderRadius: 18, borderWidth: 3, borderColor: 'transparent' },
  entryWrap: { position: 'absolute', left: 10, right: 40, top: '46%' },
  entryInner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 24, paddingLeft: 4, paddingRight: 14, paddingVertical: 4 },
  entryText: { color: 'white', fontSize: 14.5, fontWeight: '800', flex: 1 },
  idCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#FFC7DA' },
  tagChip: { backgroundColor: '#F1ECFF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  tagChipText: { color: c.violet, fontWeight: '800', fontSize: 13.5 },
  medalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 6 },
  medal: { width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 12, gap: 4, ...shadow },
  medalIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  medalName: { fontSize: 15, fontWeight: '900', color: c.ink },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: c.line, marginTop: 4, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: c.brand },
  camBadge: { position: 'absolute', right: 2, bottom: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  unoTable: { borderRadius: 24, padding: 18, gap: 10, alignItems: 'center' },
  unoLabel: { color: '#FFFFFFCC', fontSize: 12.5, fontWeight: '700' },
  colorDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'white' },
  unoStatus: { color: 'white', fontSize: 17, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  unoLog: { color: '#FFFFFFB3', fontSize: 13.5, textAlign: 'center' },
  colorPick: { backgroundColor: 'white', borderRadius: 18, padding: 14, gap: 12, alignItems: 'center', ...shadow },
  colorBig: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: 'white', ...shadow },
  notifIcon: { position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  ludoCard: { borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ludoCardTitle: { color: 'white', fontSize: 28, fontWeight: '900' },
  ludoCardSub: { color: 'white', fontSize: 14.5, lineHeight: 20, fontWeight: '600' },
  ludoCardBtn: { alignSelf: 'flex-start', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, marginTop: 8 },
  ludoCardBtnText: { color: '#1D1238', fontWeight: '900', fontSize: 14 },
  emptySlot: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.faint, alignItems: 'center', justifyContent: 'center' },
  ludoPlayers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ludoChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingLeft: 6, paddingRight: 12, borderRadius: 24, borderWidth: 2, width: '48.5%' },
  ludoChipName: { fontSize: 14.5, fontWeight: '800', color: c.ink },
  ludoBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 20, padding: 12, ...shadow },
  // banners
  connection: { flexDirection: 'row', gap: 8, backgroundColor: '#FFF0D9', padding: 10, alignItems: 'center', justifyContent: 'center' },
  connectionText: { color: '#9A5B00', fontSize: 14, fontWeight: '700' },
  errorBar: { backgroundColor: '#FFE8EA', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  error: { color: '#B4232A', fontSize: 14.5, lineHeight: 20, textAlign: 'center' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#DDF7F1', paddingHorizontal: 16, paddingVertical: 11 },
  noticeText: { flex: 1, fontSize: 15, color: '#0B6B5A', lineHeight: 21, fontWeight: '600' },
  progress: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  // floating room + nav
  floatRoom: { position: 'absolute', right: 14, borderRadius: 18, borderWidth: 3, borderColor: 'white', ...shadow },
  floatEq: { position: 'absolute', left: 4, bottom: 4, backgroundColor: c.brand, borderRadius: 8, padding: 2 },
  floatClose: { position: 'absolute', right: -8, top: -8, width: 22, height: 22, borderRadius: 11, backgroundColor: '#00000099', alignItems: 'center', justifyContent: 'center' },
  bottomNav: { flexDirection: 'row', backgroundColor: 'white', paddingTop: 8, borderTopWidth: 1, borderColor: c.line, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navPlus: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: -4 },
  navBadge: { position: 'absolute', right: -10, top: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: c.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: 'white' },
  navBadgeText: { color: 'white', fontSize: 10.5, fontWeight: '900' },
  navLabel: { color: '#4B4763', fontSize: 12, fontWeight: '600' },
  // auth
  auth: { paddingHorizontal: 20, alignItems: 'center', gap: 12 },
  brandIcon: { width: 84, height: 84, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 32, fontWeight: '900', color: c.ink },
  authNote: { textAlign: 'center', color: c.muted, fontSize: 16, lineHeight: 23 },
  authCard: { padding: 20, gap: 14, backgroundColor: 'white', borderRadius: 24, alignSelf: 'stretch', marginVertical: 10, ...shadow },
  divider: { height: 1, backgroundColor: c.line },
  desktopNote: { position: 'absolute', left: 42, bottom: 50, display: Platform.OS === 'web' ? 'flex' : 'none', pointerEvents: 'none' },
  desktopLogo: { fontSize: 30, fontWeight: '900', color: c.violet },
  desktopText: { marginTop: 10, fontSize: 18, lineHeight: 26, color: c.muted },
});
