import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import LiveDiscovery from '../../LiveDiscovery';
import { s } from '../styles';
import { brand, c, tagColors } from '../theme';
import { Item } from '../types';
import { Empty, Photo } from '../components/ui';
import type { AppCtx } from '../state/context';

export function renderHome(ctx: AppCtx) {
  const {
    act, api, banners, category, enterRoom, error, featureButtons, filteredRooms, following, homeTab, listRooms,
    loadCatalog, loading, q, setCategory, setQ, slide
  } = ctx;
  const bn = banners[slide];
  return homeTab !== 'Party' ? <LiveDiscovery rooms={filteredRooms} following={following} followOnly={homeTab === 'Follow'} onJoin={enterRoom} /> : <>
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
    {!loading && !listRooms.length && !/^\d{6,}$/.test(q.trim()) && <Empty title={error ? 'Rooms load nahi hue' : 'Koi room nahi mila'} note={error ? 'Upar refresh dabao. Server jaagne mein thoda time lag sakta hai.' : 'Kuch aur search karo, ya + dabakar apna room banao.'} />}
  </>;
}
