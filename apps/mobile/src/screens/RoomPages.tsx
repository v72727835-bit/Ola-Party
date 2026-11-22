import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { s } from '../styles';
import { Button, Diamond, Empty, Field, Heading, Photo } from '../components/ui';
import { Item } from '../types';
import { c } from '../theme';
import type { AppCtx } from '../state/context';

export function renderJoinLocked(ctx: AppCtx) {
  const {
    busy, enterRoom, page, password, pendingRoom, setPassword
  } = ctx;
  if (!(page === 'join-locked')) return null;
  return <View style={s.form}><Text style={s.sectionTitle}>{pendingRoom?.title}</Text><Text style={s.bodyMuted}>Ye private room hai. Password host se pucho.</Text><Field label="Room password" value={password} onChangeText={setPassword} secure /><Button title="Enter room" disabled={busy || !password} onPress={() => enterRoom(pendingRoom!, password)} /></View>;
}

export function renderRoomSettings(ctx: AppCtx) {
  const {
    act, api, busy, description, navigate, page, password, room, setDescription, setNotice, setPassword, setRoom,
    setTitle, title, user, who
  } = ctx;
  if (!(page === 'room-settings' && room)) return null;
  return <View style={s.form}><Field label="Room name" value={title} onChangeText={setTitle} /><Field label="Description" value={description} onChangeText={setDescription} multiline /><Field label="New room password (optional)" value={password} onChangeText={setPassword} secure /><Text style={s.small}>Password kam se kam 4 characters ka rakho, phir room lock karo to private ho jayega.</Text><Button title="Save changes" disabled={busy || !title.trim()} onPress={() => act(async () => { await api(`/rooms/${room.id}`, 'PATCH', { title, description, ...(password ? { password } : {}) }); setRoom(await api(`/rooms/${room.id}`)); navigate('room'); setPassword(''); setNotice('Room update ho gaya.'); })} /><Heading title="Members" /><View style={s.listCard}>{room.members?.filter((id: string) => id !== user?.id).map((id: string) => <View key={id} style={s.msgRow}><Photo uri={who(id).photo} name={who(id).name} size={44} /><Text style={[s.menuText, { flex: 1 }]}>{who(id).name}</Text><Button small soft title="Remove" onPress={() => act(async () => { await api(`/rooms/${room.id}/kick`, 'POST', { userId: id }); setRoom(await api(`/rooms/${room.id}`)); })} /></View>)}</View></View>;
}

export function renderPk(ctx: AppCtx) {
  const {
    act, api, battle, page, room, setBattle, user, who
  } = ctx;
  if (!(page === 'pk')) return null;
  return <View style={s.form}><LinearGradient colors={['#FF2E74', '#3D7BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.hero}><Text style={s.heroTitle}>PK Battle</Text><Text style={s.heroSub}>3 minute ka gift-score muqabla. Test coins only.</Text></LinearGradient>{battle ? <View style={s.card}><Text style={s.sectionTitle}>{battle.status === 'active' ? 'Battle chal raha hai' : 'Battle khatam'}</Text><Text style={s.small}>Ends at {new Date(battle.endsAt).toLocaleTimeString()}</Text>{battle.scores?.map((p: Item) => <View key={p.user.id} style={s.msgRow}><Photo uri={p.user.photo} name={p.user.name} /><Text style={[s.menuText, { flex: 1 }]}>{p.user.name}</Text><Diamond n={p.score} /></View>)}</View> : <Empty title="Koi battle nahi chal raha" note="Host kisi member ko 3 minute ke battle ke liye challenge kar sakta hai." />}{room?.ownerId === user?.id && battle?.status !== 'active' && <><Text style={s.label}>Kisko challenge karna hai?</Text><View style={s.listCard}>{room?.members?.filter((id: string) => id !== user?.id).map((id: string) => <Pressable key={id} style={s.msgRow} onPress={() => act(async () => { await api(`/rooms/${room!.id}/pk`, 'POST', { opponentId: id, durationSeconds: 180 }); setBattle(await api(`/rooms/${room!.id}/pk`)); })}><Photo uri={who(id).photo} name={who(id).name} /><Text style={[s.menuText, { flex: 1 }]}>{who(id).name}</Text><Text style={s.link}>Challenge</Text></Pressable>)}</View></>}<Button title="Refresh scores" soft onPress={() => act(async () => setBattle(await api(`/rooms/${room!.id}/pk`)))} /></View>;
}

export function renderCreateRoom(ctx: AppCtx) {
  const {
    act, api, busy, description, formCategory, navigate, page, refresh, setDescription, setFormCategory,
    setMessages, setRoom, setTitle, title
  } = ctx;
  if (!(page === 'create-room')) return null;
  return <View style={s.form}><Text style={s.bodyMuted}>Room ka naam aur category choose karo, phir friends ko bulao.</Text><Field label="Room name" value={title} onChangeText={setTitle} placeholder="e.g. Sunday Night Adda" /><Field label="What's it about?" value={description} onChangeText={setDescription} multiline placeholder="Music, chit-chat, gaming..." /><Text style={s.label}>Category</Text><View style={s.wrap}>{['Chat', 'Chill', 'Music', 'Gaming', 'Friends'].map(cat => <Pressable key={cat} onPress={() => setFormCategory(cat)} style={[s.chip, formCategory === cat && s.chipOn]}><Text style={[s.chipText, formCategory === cat && { color: 'white' }]}>{cat}</Text></Pressable>)}</View><Button title="Start room" disabled={busy || !title.trim()} onPress={() => act(async () => { const r = await api('/rooms', 'POST', { title, description, category: formCategory }); await api(`/rooms/${r.id}/join`, 'POST', {}); setRoom(await api(`/rooms/${r.id}`)); setMessages(await api(`/rooms/${r.id}/messages`)); navigate('room'); await refresh(); })} /></View>;
}

export function renderQueue(ctx: AppCtx) {
  const {
    act, api, busy, currentSeat, page, queue, room, setQueue, setRoom, user
  } = ctx;
  if (!(page === 'queue' && room)) return null;
  return <View style={s.form}><Text style={s.bodyMuted}>Bolna hai? Queue mein aao, host aapko khali seat pe bula lega.</Text>{(() => { const inQueue = queue.some(x => x.id === user?.id); const seated = !!currentSeat; return <Button title={seated ? 'Aapke paas seat hai' : inQueue ? 'Leave queue' : 'Raise hand'} disabled={busy || seated} onPress={() => act(async () => { setQueue(await api(`/rooms/${room.id}/queue`, 'POST', { action: inQueue ? 'leave' : 'join' })); })} />; })()}{queue.length === 0 && <Empty title="Queue khali hai" note="Sabse pehle haath uthao." />}{queue.length > 0 && <View style={s.listCard}>{queue.map((qq, i) => <View key={qq.id} style={s.msgRow}><Text style={s.rankNum}>{i + 1}</Text><Photo uri={qq.photo} name={qq.name} size={42} /><Text style={[s.menuText, { flex: 1 }]}>{qq.name}</Text>{room.ownerId === user?.id && <Button small title="Invite" soft disabled={busy} onPress={() => act(async () => { await api(`/rooms/${room.id}/queue/promote`, 'POST', { userId: qq.id }); setQueue(await api(`/rooms/${room.id}/queue`)); setRoom(await api(`/rooms/${room.id}`)); })} />}</View>)}</View>}</View>;
}

export function renderLucky(ctx: AppCtx) {
  const {
    act, api, bagCount, bagTotal, bags, busy, page, refresh, room, setBagCount, setBagTotal, setBags, setNotice,
    user
  } = ctx;
  if (!(page === 'lucky' && room)) return null;
  return <View style={s.form}><LinearGradient colors={['#E5484D', '#FF9F1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}><Text style={s.heroTitle}>Lucky bag</Text><Text style={s.heroSub}>Room mein sabke saath coins baanto. Jo bacha, 24 ghante baad wapas.</Text></LinearGradient><View style={[s.card, { gap: 14 }]}><Field label="Total coins (10-10000)" value={bagTotal} onChangeText={setBagTotal} /><Field label="Kitne logon mein (2-20)" value={bagCount} onChangeText={setBagCount} /><Button title="Send lucky bag" disabled={busy} onPress={() => act(async () => { await api(`/rooms/${room.id}/lucky-bags`, 'POST', { total: Number(bagTotal), count: Number(bagCount) }); setBags(await api(`/rooms/${room.id}/lucky-bags`)); await refresh(); setNotice('Lucky bag bhej diya.'); })} /></View>{bags.length > 0 && <View style={s.listCard}>{bags.map(bg => <View key={bg.id} style={s.msgRow}><Photo uri={bg.sender?.photo} name={bg.sender?.name} size={44} /><View style={{ flex: 1 }}><Text style={s.menuText}>{bg.sender?.name} ka bag</Text><Text style={s.small}>{bg.total} coins · {bg.remaining} of {bg.count} left</Text>{bg.mine != null && <Text style={[s.small, { color: c.teal, fontWeight: '700' }]}>Aapko mile {bg.mine} coins</Text>}</View>{bg.mine == null && bg.sender?.id !== user?.id && bg.remaining > 0 && <Button small title="Grab" disabled={busy} onPress={() => act(async () => { const r = await api(`/lucky-bags/${bg.id}/claim`, 'POST', {}); setNotice(`Aapko ${r.amount} coins mile!`); setBags(await api(`/rooms/${room.id}/lucky-bags`)); await refresh(); })} />}</View>)}</View>}</View>;
}
