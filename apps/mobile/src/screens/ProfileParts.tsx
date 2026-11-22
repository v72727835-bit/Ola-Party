import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Item, MIcon } from '../types';
import { s } from '../styles';
import { c } from '../theme';
import { zodiac } from '../utils';
import type { AppBase } from '../state/context';

export function makeAboutRows(ctx: AppBase) {
  return (p?: Item | null) => <View style={{ gap: 12 }}>
    <View style={s.row}><Ionicons name="location-outline" size={19} color={c.muted} /><Text style={s.small}>{p?.hometown || 'Hometown not added'}</Text></View>
    <View style={s.row}><Ionicons name="calendar-outline" size={19} color={c.muted} /><Text style={s.small}>{p?.birthday ? `${new Date(p.birthday + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long' })} · ${zodiac(p.birthday)}` : 'Birthday not added'}</Text></View>
    <View style={s.row}><Ionicons name="star-outline" size={19} color={c.muted} /><Text style={s.small}>Level {p?.level || 1}</Text></View>
    {!!p?.tags?.length && <View style={s.wrap}>{p.tags.map((t: string) => <View key={t} style={s.tagChip}><Text style={s.tagChipText}>{t}</Text></View>)}</View>}
  </View>;
}

export function makeHonorGrid(ctx: AppBase) {
  const {
    honor
  } = ctx;
  return <View style={s.medalGrid}>{honor.map(m => <View key={m.id} style={[s.medal, !m.earned && { opacity: .55 }]}><LinearGradient colors={m.earned ? ['#FFD54A', '#FF9F1C'] : ['#D9D5E6', '#B9B4CC']} style={s.medalIcon}><MaterialCommunityIcons name={({ generous: 'hand-heart', star: 'star-shooting', host: 'microphone-variant', popular: 'account-heart', writer: 'feather', veteran: 'shield-star' } as Record<string, MIcon>)[m.id] || 'medal'} size={26} color="white" /></LinearGradient><Text style={s.medalName}>{m.name}</Text><Text style={s.tiny}>{m.desc}</Text><View style={s.progressTrack}><View style={[s.progressFill, { width: `${Math.min(100, Math.round(m.value / m.goal * 100))}%` }]} /></View><Text style={s.tiny}>{Math.min(m.value, m.goal)}/{m.goal}</Text></View>)}{!honor.length && <ActivityIndicator color={c.brand} />}</View>;
}
