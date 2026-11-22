import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GiftArtwork } from '../../GiftDrawer';
import GiftCelebration from '../../GiftCelebration';
import { Item } from '../types';
import { API_HOST, brand, c, fallbackTints, warm } from '../theme';
import { hash, initials } from '../utils';
import { s } from '../styles';

export function GiftBurst({ burst }: { burst: Item | null }) { return <GiftCelebration gift={burst} />; }

export function Photo({ uri, name, size = 46, radius, ring, ringColors = warm }: { uri?: string; name?: string; size?: number; radius?: number; ring?: boolean; ringColors?: [string, string] }) {
  const [failed, setFailed] = useState(false);
  if (uri && uri.startsWith('/')) uri = API_HOST + uri;
  const r = radius ?? size / 2;
  const inner = uri && !failed
    ? <Image source={{ uri }} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: r, backgroundColor: '#E9E6F2' }} />
    : <LinearGradient colors={fallbackTints[hash(name) % fallbackTints.length]} style={{ width: size, height: size, borderRadius: r, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontWeight: '800', fontSize: size * .36 }}>{initials(name)}</Text></LinearGradient>;
  return ring ? <LinearGradient colors={ringColors} style={{ padding: 2.5, borderRadius: r + 3 }}><View style={{ padding: 2, borderRadius: r + 2, backgroundColor: 'white' }}>{inner}</View></LinearGradient> : inner;
}
export function Level({ level = 1, gender }: { level?: number; gender?: string }) {
  const col: [string, string] = gender === 'female' ? ['#FF7AB6', '#FF2E74'] : gender === 'male' ? ['#6AB0FF', '#3D7BFF'] : ['#B99BFF', '#7C3AED'];
  return <LinearGradient colors={col} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.level}>{gender && <Ionicons name={gender === 'female' ? 'female' : 'male'} size={11} color="white" />}<Text style={s.levelText}>{level}</Text></LinearGradient>;
}
export function Coin({ n, size = 15, dark = false }: { n: number | string; size?: number; dark?: boolean }) { return <View style={s.inline}><MaterialCommunityIcons name="circle-multiple" size={size} color={c.gold} /><Text style={[s.coinTxt, { fontSize: size, color: dark ? 'white' : c.ink }]}>{n}</Text></View>; }
export function Diamond({ n, size = 15, dark = false }: { n: number | string; size?: number; dark?: boolean }) { return <View style={s.inline}><MaterialCommunityIcons name="diamond-stone" size={size} color="#38BDF8" /><Text style={[s.coinTxt, { fontSize: size, color: dark ? 'white' : c.ink }]}>{n}</Text></View>; }
export function GiftArt({ id, size = 64 }: { id: string; size?: number }) { return <GiftArtwork id={id} size={size} />; }
export function Button({ title, onPress, soft = false, disabled = false, small = false, dark = false }: { title: string; onPress: () => void; soft?: boolean; disabled?: boolean; small?: boolean; dark?: boolean }) {
  const label = <Text style={[s.buttonText, small && { fontSize: 14.5 }, soft && { color: dark ? 'white' : c.brand }]}>{title}</Text>;
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [{ opacity: disabled ? .45 : pressed ? .85 : 1 }]}>
    {soft ? <View style={[s.button, small && s.buttonSmall, { backgroundColor: dark ? '#FFFFFF1F' : '#FFE8F0' }]}>{label}</View> : <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.button, small && s.buttonSmall]}>{label}</LinearGradient>}
  </Pressable>;
}
export function Field({ label, value, onChangeText, secure = false, multiline = false, placeholder = '' }: { label: string; value: string; onChangeText: (v: string) => void; secure?: boolean; multiline?: boolean; placeholder?: string }) {
  return <View style={{ gap: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} secureTextEntry={secure} multiline={multiline} placeholder={placeholder} placeholderTextColor={c.faint} style={[s.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]} autoCapitalize={label.toLowerCase().includes('email') ? 'none' : 'sentences'} /></View>;
}
export function Heading({ title, note, action, actionLabel = 'Refresh' }: { title: string; note?: string; action?: () => void; actionLabel?: string }) {
  return <View style={s.sectionHead}><View style={{ flex: 1 }}><Text style={s.sectionTitle}>{title}</Text>{note && <Text style={s.small}>{note}</Text>}</View>{action && <Pressable accessibilityRole="button" onPress={action}><Text style={s.link}>{actionLabel}</Text></Pressable>}</View>;
}
export function Empty({ title, note }: { title: string; note: string }) { return <View style={s.empty}><Text style={s.cardTitle}>{title}</Text><Text style={[s.small, { textAlign: 'center' }]}>{note}</Text></View>; }
export function Tabs({ items, value, onChange, big = false }: { items: string[]; value: string; onChange: (v: string) => void; big?: boolean }) {
  return <View style={[s.row, { gap: 20 }]}>{items.map(t => <Pressable key={t} onPress={() => onChange(t)} style={{ alignItems: 'center', gap: 5 }}><Text style={[big ? s.tabBig : s.tab, value === t && (big ? s.tabBigOn : s.tabOn)]}>{t}</Text><View style={[s.tabLine, value !== t && { backgroundColor: 'transparent' }]} /></Pressable>)}</View>;
}
export function SpeakRing({ active, size }: { active: boolean; size: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { if (!active) { v.stopAnimation(); v.setValue(0); return; } const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' })); loop.start(); return () => loop.stop(); }, [active]);
  if (!active) return null;
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: '#5EF2C6', opacity: v.interpolate({ inputRange: [0, 1], outputRange: [.9, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] }} />;
}
