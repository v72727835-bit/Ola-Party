import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Item } from '../types';

export const LUDO: Record<string, string> = { red: '#E5484D', green: '#1FA35B', yellow: '#F2B705', blue: '#2D7FF9' };
export const LUDO_SOFT: Record<string, string> = { red: '#FDE2E3', green: '#DDF5E7', yellow: '#FFF3C4', blue: '#DDEBFF' };
export const L_OFFSET: Record<string, number> = { red: 0, green: 13, yellow: 26, blue: 39 };
export const L_SAFE = [0, 8, 13, 21, 26, 34, 39, 47];
export const L_TRACK: [number, number][] = [[6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]];
export const L_HOMECOL: Record<string, [number, number][]> = { red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]], green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]], yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]], blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]] };
export const L_YARD: Record<string, [number, number]> = { red: [0, 0], green: [0, 9], yellow: [9, 9], blue: [9, 0] };
export const L_FINISH: Record<string, [number, number]> = { red: [7, 6.3], green: [6.3, 7], yellow: [7, 7.7], blue: [7.7, 7] };
export const ludoLegal = (g: Item, id: string, dice: number) => ((g.tokens?.[id] || []) as number[]).map((p, i) => ((p === -1 && dice === 6) || (p >= 0 && p + dice <= 56) ? i : -1)).filter(i => i >= 0);
export const ludoCell = (color: string, pos: number, i: number): [number, number] => {
  if (pos === -1) { const [r, cc] = L_YARD[color]; return [r + 1.5 + (i >= 2 ? 2 : 0), cc + 1.5 + (i % 2 ? 2 : 0)]; }
  if (pos <= 50) return L_TRACK[(pos + L_OFFSET[color]) % 52];
  if (pos <= 55) return L_HOMECOL[color][pos - 51];
  return L_FINISH[color];
};

export function Dice({ value, rolling, size = 64 }: { value?: number | null; rolling?: boolean; size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => { spin.setValue(0); Animated.timing(spin, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start(); }, [value, rolling]);
  const pips: Record<number, [number, number][]> = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [0, 2], [2, 0], [2, 2]], 5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]], 6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]] };
  const d = size * .16; const pad = size * .17; const step = (size - pad * 2 - d) / 2;
  return <Animated.View style={{ width: size, height: size, borderRadius: size * .22, backgroundColor: 'white', borderWidth: 2, borderColor: '#E4E0EE', transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) }, { scale: spin.interpolate({ inputRange: [0, .5, 1], outputRange: [.8, 1.12, 1] }) }] }}>
    {(pips[value || 0] || []).map(([r, cc], k) => <View key={k} style={{ position: 'absolute', width: d, height: d, borderRadius: d / 2, backgroundColor: value === 6 || value === 1 ? '#E5484D' : '#1D1238', top: pad + r * step, left: pad + cc * step }} />)}
    {!value && <Text style={{ position: 'absolute', alignSelf: 'center', top: size * .3, fontSize: size * .26, fontWeight: '900', color: '#9893AD' }}>?</Text>}
  </Animated.View>;
}

export function LudoBoard({ g, me, size, onToken }: { g: Item; me?: string; size: number; onToken: (i: number) => void }) {
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
