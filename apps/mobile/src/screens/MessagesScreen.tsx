import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { s } from '../styles';
import { Empty, Photo } from '../components/ui';
import { ago, firstName } from '../utils';
import { brand, c } from '../theme';
import type { AppCtx } from '../state/context';

export function renderMessages(ctx: AppCtx) {
  const {
    act, allPeople, api, conversations, enterRoom, knownConvs, navigate, openDm, rooms, setVisitors, strangerConvs,
    user
  } = ctx;
  const onlineFriends = Object.values(allPeople).filter(p => p.id !== user?.id);
  return <>
    {onlineFriends.length > 0 && <><Text style={[s.label, { marginBottom: 12 }]}>Friends online</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>{onlineFriends.slice(0, 12).map(p => <Pressable key={p.id} style={{ alignItems: 'center', gap: 4, width: 66 }} onPress={() => { const r = rooms.find(rr => rr.members?.includes(p.id)); if (r) enterRoom(r); }}><View><Photo uri={p.photo} name={p.name} size={60} /><View style={s.onlineDot} /></View><Text style={s.faceLabel}>{firstName(p.name)}</Text><Text style={s.tiny}>In a room</Text></Pressable>)}</ScrollView></>}
    <View style={s.listCard}>
      <View style={s.msgRow}><LinearGradient colors={brand} style={s.sysIcon}><Ionicons name="megaphone" size={22} color="white" /></LinearGradient><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.cardTitle}>Party App Team</Text><Text style={s.tiny}>Today</Text></View><Text style={s.small}>Welcome! Tap any room on Party to join the conversation.</Text></View></View>
      <Pressable style={s.msgRow} onPress={() => act(async () => { setVisitors(await api('/me/visitors')); navigate('visitors'); })}><LinearGradient colors={['#8B3DFF', '#3D7BFF']} style={s.sysIcon}><Ionicons name="eye" size={22} color="white" /></LinearGradient><View style={{ flex: 1, gap: 3 }}><Text style={s.cardTitle}>People who visited me</Text><Text style={s.small}>Dekho kaun aapki profile par aaya</Text></View><Ionicons name="chevron-forward" size={18} color={c.faint} /></Pressable>
      {strangerConvs.length > 0 && <Pressable style={s.msgRow} onPress={() => navigate('strangers')}><View style={{ width: 54, height: 54 }}>{strangerConvs.slice(0, 2).map((cv, i) => <View key={cv.user.id} style={{ position: 'absolute', left: i * 14, top: i * 14 }}><Photo uri={cv.user.photo} name={cv.user.name} size={38} /></View>)}</View><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.cardTitle}>Stranger messages</Text><Text style={s.tiny}>{ago(strangerConvs[0]?.lastMessage?.createdAt)}</Text></View><View style={s.row}><Text style={[s.small, { flex: 1 }]}>{strangerConvs[0]?.user?.name}: {strangerConvs[0]?.lastMessage?.text}</Text><View style={s.badge}><Text style={s.badgeText}>{strangerConvs.length}</Text></View></View></View></Pressable>}
      {knownConvs.map((cv, k) => { const mine = cv.lastMessage?.fromId === user?.id; return <Pressable key={cv.user.id} style={[s.msgRow, k === knownConvs.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openDm(cv.user)}><Photo uri={cv.user.photo} name={cv.user.name} size={54} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.cardTitle, { flex: 1 }]}>{cv.user.name}</Text><Text style={s.tiny}>{ago(cv.lastMessage?.createdAt)}</Text></View><View style={s.row}><Text style={[s.small, { flex: 1 }]}>{mine ? 'You: ' : ''}{cv.lastMessage?.text || 'Say hello'}</Text>{!mine && <View style={s.badge}><Text style={s.badgeText}>1</Text></View>}</View></View></Pressable>; })}
    </View>
    {!conversations.length && <Empty title="Inbox khali hai" note="Kisi ki profile kholo aur message bhejo." />}
  </>;
}
