import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { s } from '../styles';
import { Button, Coin, Diamond, Empty, Field, Level, Photo } from '../components/ui';
import { firstName, when } from '../utils';
import { c } from '../theme';
import type { AppCtx } from '../state/context';

export function renderFamilies(ctx: AppCtx) {
  const {
    act, api, busy, catalog, description, page, setCatalog, setDescription, setNotice, setTitle, title, user
  } = ctx;
  if (!(page === 'families')) return null;
  return <><Text style={s.bodyMuted}>Apni gang dhoondo, ya khud banao.</Text>{catalog.families?.map(f => { const inIt = f.members?.includes(user?.id); return <View key={f.id} style={s.card}><View style={s.row}><Photo uri={f.cover} name={f.name} size={58} radius={16} /><View style={{ flex: 1, gap: 2 }}><Text style={s.cardTitle}>{f.name}</Text><Text style={s.small}>{f.members?.length || 0} members</Text></View><Button small soft={inIt} title={inIt ? 'Leave' : 'Join'} onPress={() => act(async () => { await api(`/families/${f.id}/join`, inIt ? 'DELETE' : 'POST', {}); const data = await api('/families'); setCatalog(prev => ({ ...prev, families: data })); })} /></View><Text style={[s.body, { marginTop: 12 }]}>{f.description}</Text></View>; })}<View style={[s.card, { gap: 14 }]}><Text style={s.sectionTitle}>Nayi family banao</Text><Field label="Family name" value={title} onChangeText={setTitle} /><Field label="Description" value={description} onChangeText={setDescription} /><Button title="Create family" disabled={!title.trim() || busy} onPress={() => act(async () => { await api('/families', 'POST', { name: title, description }); const data = await api('/families'); setCatalog(prev => ({ ...prev, families: data })); setTitle(''); setNotice('Family ban gayi.'); })} /></View></>;
}

export function renderEvents(ctx: AppCtx) {
  const {
    act, api, banners, catalog, page, setCatalog, setNotice, user
  } = ctx;
  if (!(page === 'events')) return null;
  return <>{catalog.events?.map((e, i) => { const joined = (e.attendees || e.rsvps || []).includes(user?.id); return <View key={e.id} style={s.card}><LinearGradient colors={banners[i % 3].colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.eventArt}><Photo uri={e.cover} name={e.title} size={64} ring ringColors={['#FFFFFF', '#FFE08A']} /><View style={{ flex: 1, gap: 4 }}><Text style={s.eventDate}>{when(e.startsAt || e.startAt)}</Text><Text style={s.eventTitle}>{e.title}</Text></View></LinearGradient><Text style={[s.body, { marginVertical: 12 }]}>{e.description}</Text><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.small}>{(e.attendees || e.rsvps || []).length} going</Text><Button small soft={joined} title={joined ? 'Going' : 'Join'} onPress={() => act(async () => { await api(`/events/${e.id}/rsvp`, joined ? 'DELETE' : 'POST', {}); const data = await api('/events'); setCatalog(prev => ({ ...prev, events: data })); setNotice(joined ? 'RSVP cancel ho gaya.' : 'Done! Aapka naam list mein hai.'); })} /></View></View>; })}{!catalog.events?.length && <Empty title="Abhi koi event nahi" note="Naye events jald aayenge." />}</>;
}

export function renderTasks(ctx: AppCtx) {
  const {
    act, api, busy, catalog, page, refresh, setCatalog, setNotice
  } = ctx;
  if (!(page === 'tasks')) return null;
  return <><LinearGradient colors={['#00B89C', '#3D7BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}><Text style={s.heroTitle}>Daily rewards</Text><Text style={s.heroSub}>Roz ke chhote kaam karo, coins kamao.</Text></LinearGradient><View style={[s.listCard, { marginTop: 14 }]}>{catalog.tasks?.map((t, k) => <View key={t.id} style={[s.msgRow, k === (catalog.tasks?.length || 0) - 1 && { borderBottomWidth: 0 }]}><View style={{ flex: 1, gap: 4 }}><Text style={s.menuText}>{t.title}</Text><Coin n={`+${t.reward}`} size={14} /></View><Button small soft={!t.ready || t.claimed} title={t.claimed ? 'Done' : t.ready ? 'Claim' : 'Go'} disabled={busy || t.claimed || !t.ready} onPress={() => act(async () => { await api(`/tasks/${t.id}/claim`, 'POST', {}); const data = await api('/tasks'); setCatalog(prev => ({ ...prev, tasks: data })); await refresh(); setNotice('Reward mil gaya.'); })} /></View>)}</View></>;
}

export function renderLeaderboard(ctx: AppCtx) {
  const {
    catalog, openProfile, page
  } = ctx;
  if (!(page === 'leaderboard')) return null;
  const list = catalog.leaderboard || [];
  const top = list.slice(0, 3);
  const order = [top[1], top[0], top[2]];
  return <><LinearGradient colors={['#FFC23C', '#FF7A1A', '#FF2E74']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.podium}><Text style={s.podiumTitle}>Weekly stars</Text><Text style={s.podiumSub}>Most diamonds received this week</Text><View style={s.podiumRow}>{order.map((r, k) => r ? <Pressable key={r.user.id} style={[s.podiumItem, k === 1 && { marginTop: -20 }]} onPress={() => openProfile(r.user.id)}>{k === 1 && <MaterialCommunityIcons name="crown" size={28} color="#FFF3B0" />}<Photo uri={r.user.photo} name={r.user.name} size={k === 1 ? 78 : 62} ring ringColors={k === 1 ? ['#FFF3B0', '#FFD54A'] : ['#FFFFFF', '#E5E7EB']} /><Text style={s.podiumName}>{firstName(r.user.name)}</Text><View style={s.podiumScore}><Diamond n={r.diamonds} size={13} dark /></View><Text style={s.podiumRank}>{k === 1 ? '1st' : k === 0 ? '2nd' : '3rd'}</Text></Pressable> : <View key={k} style={s.podiumItem} />)}</View></LinearGradient><View style={s.listCard}>{list.slice(3).map((r, i) => <Pressable key={r.user.id} style={s.msgRow} onPress={() => openProfile(r.user.id)}><Text style={s.rankNum}>{r.rank || i + 4}</Text><Photo uri={r.user.photo} name={r.user.name} size={44} /><View style={{ flex: 1, gap: 3 }}><Text style={s.menuText}>{r.user.name}</Text><Level level={r.user.level} gender={r.user.gender} /></View><Diamond n={r.diamonds} /></Pressable>)}</View></>;
}

export function renderStore(ctx: AppCtx) {
  const {
    catalog, page
  } = ctx;
  if (!(page === 'store')) return null;
  return <><LinearGradient colors={['#2B0A55', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, { alignItems: 'center' }]}><MaterialCommunityIcons name="crown" size={52} color={c.gold} /><Text style={s.heroTitle}>Party VIP</Text><Text style={[s.heroSub, { textAlign: 'center' }]}>Special badge, entry effects and a golden name in chat.</Text></LinearGradient>{catalog[page]?.map((v, i) => <View key={v.id || i} style={s.card}><Text style={s.cardTitle}>{v.name || v.title}</Text><Text style={[s.body, { marginTop: 6 }]}>{v.description || (v.benefits || []).join(' · ')}</Text></View>)}<View style={s.infoBox}><Text style={s.small}>VIP kharidna abhi band hai. Payment system lagne ke baad chalu hoga.</Text></View></>;
}
