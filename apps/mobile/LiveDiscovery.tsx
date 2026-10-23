import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
type Row = Record<string, any>;
export default function LiveDiscovery({ rooms, following, followOnly, onJoin }: { rooms: Row[]; following: string[]; followOnly: boolean; onJoin: (room: Row) => void }) {
  const [filter, setFilter] = useState('Recommend');
  const owner = (r: Row) => (r.people || []).find((p: Row) => p.id === r.ownerId);
  let shown = rooms.filter(r => !followOnly || following.includes(r.ownerId) || r.members?.some((id: string) => following.includes(id)));
  if (filter === 'Megastar') shown = [...shown].sort((a, b) => (owner(b)?.level || 1) - (owner(a)?.level || 1));
  if (filter === 'Talent') shown = shown.filter(r => ['Music', 'Gaming'].includes(r.category));
  if (filter === 'NewStar') shown = [...shown].sort((a, b) => (owner(a)?.level || 1) - (owner(b)?.level || 1));
  return <View style={{ gap: 14 }}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{['Recommend', 'Megastar', 'Talent', 'NewStar'].map(t => <Pressable accessibilityRole="tab" accessibilityState={{ selected: filter === t }} key={t} onPress={() => setFilter(t)} style={[s.tab, filter === t && { backgroundColor: '#A7FF28' }]}><Text style={{ color: '#242137', fontSize: 12, fontWeight: '800' }}>{t}</Text></Pressable>)}</ScrollView>
    <View style={s.grid}>{shown.map((r, i) => <Pressable accessibilityRole="button" accessibilityLabel={`Join ${r.title}`} key={r.id} onPress={() => onJoin(r)} style={s.card}>
      <LinearGradient colors={i % 2 ? ['#075F59', '#08AF97'] : ['#3B1766', '#C05591']} style={StyleSheet.absoluteFill} />
      {!!(r.cover || owner(r)?.photo) && <Image source={{ uri: r.cover || owner(r)?.photo }} style={StyleSheet.absoluteFill} />}
      <View style={s.top}><Text style={s.badge}>◉ LIVE VOICE</Text><Text style={s.count}>♟ {r.members?.length || 0}</Text></View>
      <View style={{ flex: 1 }} /><LinearGradient colors={['transparent', '#111026F0']} style={s.bottom}><Text numberOfLines={2} style={s.title}>{r.title}</Text><Text numberOfLines={1} style={s.sub}>{r.category} · {owner(r)?.name || 'Your host'}</Text><Text style={s.sub}>{r.demo ? 'Demo room' : 'Audio room'} · {(r.seats || []).filter((x: Row) => !x.userId && !x.locked).length} seats free</Text></LinearGradient>
    </Pressable>)}</View>
    {!shown.length && <Text style={{ color: '#817B92', textAlign: 'center', padding: 28 }}>{followOnly ? 'Follow people to discover their rooms here.' : 'No rooms in this category yet.'}</Text>}
  </View>;
}
const s = StyleSheet.create({ tab: { backgroundColor: '#EAE7F0', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, card: { width: '48%', height: 235, borderRadius: 14, overflow: 'hidden', backgroundColor: '#28213F' }, top: { flexDirection: 'row', justifyContent: 'space-between', padding: 8 }, badge: { fontSize: 8, fontWeight: '900', color: 'white', borderRadius: 8, padding: 4, backgroundColor: '#8648D6' }, count: { fontSize: 10, color: 'white', fontWeight: '800', textShadowColor: '#000', textShadowRadius: 3 }, bottom: { padding: 10, paddingTop: 30, gap: 4 }, title: { fontSize: 14, fontWeight: '800', color: 'white' }, sub: { color: '#E6DDED', fontSize: 10 } });
