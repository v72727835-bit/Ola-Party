import React from 'react';
import { Animated, Easing, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Item, MIcon } from '../types';

export const UNO_COL: Record<string, string> = { red: '#E5484D', yellow: '#F2B705', green: '#1FA35B', blue: '#2D7FF9', wild: '#1D1238' };
export function UnoCard({ card, w = 58, lifted = false, dim = false }: { card?: Item; w?: number; lifted?: boolean; dim?: boolean }) {
  const h = w * 1.45; if (!card) return <LinearGradient colors={['#1D1238', '#3B1E7A']} style={{ width: w, height: h, borderRadius: w * .16, borderWidth: 2.5, borderColor: 'white', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFD54A', fontWeight: '900', fontSize: w * .3, transform: [{ rotate: '-20deg' }] }}>UNO</Text></LinearGradient>;
  const label = card.value === 'draw2' ? '+2' : card.value === 'wild4' ? '+4' : card.value === 'skip' ? null : card.value === 'reverse' ? null : card.value === 'wild' ? null : card.value;
  const icon: MIcon | null = card.value === 'skip' ? 'cancel' : card.value === 'reverse' ? 'swap-horizontal' : card.value === 'wild' ? 'palette' : null;
  return <View style={{ width: w, height: h, borderRadius: w * .16, backgroundColor: UNO_COL[card.color], borderWidth: 2.5, borderColor: 'white', alignItems: 'center', justifyContent: 'center', opacity: dim ? .55 : 1, transform: [{ translateY: lifted ? -10 : 0 }], ...Platform.select({ web: { boxShadow: '0 3px 8px rgba(0,0,0,.25)' } as any, default: { elevation: 3 } }) }}>
    <View style={{ position: 'absolute', width: w * .78, height: h * .62, borderRadius: w, backgroundColor: '#FFFFFF2E', transform: [{ rotate: '25deg' }] }} />
    {card.color === 'wild' && <View style={{ position: 'absolute', width: w * .62, height: w * .62, flexDirection: 'row', flexWrap: 'wrap', borderRadius: w, overflow: 'hidden', transform: [{ rotate: '25deg' }] }}>{['red', 'blue', 'yellow', 'green'].map(cc => <View key={cc} style={{ width: '50%', height: '50%', backgroundColor: UNO_COL[cc] }} />)}</View>}
    {label ? <Text style={{ color: 'white', fontSize: w * .42, fontWeight: '900', textShadowColor: '#0006', textShadowRadius: 3 }}>{label}</Text> : icon ? <MaterialCommunityIcons name={icon} size={w * .45} color="white" /> : null}
  </View>;
}
