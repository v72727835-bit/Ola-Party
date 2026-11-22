import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { s } from '../styles';
import { Empty, Heading, Level, Photo } from '../components/ui';
import { brand, c } from '../theme';
import { ago } from '../utils';
import type { AppCtx } from '../state/context';

export function renderDm(ctx: AppCtx) {
  const {
    busy, dm, messages, navigate, openProfile, page, sendMessage, setGiftFromDm, setRecipient, setText, text, user
  } = ctx;
  const dmView = <><View style={{ gap: 12, paddingVertical: 6 }}>{messages.filter(m => (m.fromId === dm?.id && m.toId === user?.id) || (m.fromId === user?.id && m.toId === dm?.id)).map(m => { const mine = m.fromId === user?.id; return <View key={m.id} style={[s.row, { alignItems: 'flex-end', alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%' }]}>{!mine && <Photo uri={dm?.photo} name={dm?.name} size={32} />}{mine ? <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.bubble, s.bubbleMine]}><Text style={[s.body, { color: 'white' }]}>{m.text}</Text><Text style={[s.bubbleTime, { color: '#FFFFFFB3' }]}>{ago(m.createdAt)}</Text></LinearGradient> : <View style={s.bubble}><Text style={s.body}>{m.text}</Text><Text style={s.bubbleTime}>{ago(m.createdAt)}</Text></View>}</View>; })}</View>
    <View style={s.composer}><Pressable accessibilityLabel="Send a gift" onPress={() => { if (!dm) return; setRecipient(dm.id); setGiftFromDm(true); navigate('gifts'); }} style={{ paddingRight: 8 }}><LinearGradient colors={['#FFB21C', '#FF2E74']} style={s.sendBtn}><MaterialCommunityIcons name="gift" size={18} color="white" /></LinearGradient></Pressable><TextInput accessibilityLabel="Message" placeholder="Type a message..." placeholderTextColor={c.faint} value={text} onChangeText={setText} style={s.composerInput} onSubmitEditing={sendMessage} /><Pressable accessibilityLabel="Send message" disabled={!text.trim() || busy} onPress={sendMessage}><LinearGradient colors={brand} style={[s.sendBtn, !text.trim() && { opacity: .5 }]}><Ionicons name="send" size={18} color="white" /></LinearGradient></Pressable></View></>;
  if (!(page === 'dm')) return null;
  return <>{dm && <Pressable style={[s.listCard, s.msgRow, { paddingHorizontal: 14, borderBottomWidth: 0 }]} onPress={() => openProfile(dm.id)}><Photo uri={dm.photo} name={dm.name} size={50} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>{dm.name}</Text><Text style={s.small}>{dm.bio || 'Tap to view profile'}</Text></View></Pressable>}{dmView}</>;
}

export function renderComments(ctx: AppCtx) {
  const {
    act, api, busy, comments, page, post, refresh, setComments, setText, text
  } = ctx;
  if (!(page === 'comments' && post)) return null;
  return <><View style={s.post}><View style={s.row}><Photo uri={post.author?.photo} name={post.author?.name} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>{post.author?.name}</Text><Text style={s.tiny}>{ago(post.createdAt)}</Text></View></View><Text style={[s.body, { marginTop: 12 }]}>{post.text}</Text></View><Heading title={`${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`} />{comments.map(cm => <View key={cm.id} style={[s.row, { alignItems: 'flex-start', marginBottom: 14 }]}><Photo uri={cm.author?.photo} name={cm.author?.name} size={38} /><View style={[s.bubble, { flex: 1 }]}><Text style={s.chatAuthorLight}>{cm.author?.name || 'Member'}</Text><Text style={s.body}>{cm.text}</Text><Text style={s.bubbleTime}>{ago(cm.createdAt)}</Text></View></View>)}<View style={s.composer}><TextInput accessibilityLabel="Your comment" placeholder="Write a comment..." placeholderTextColor={c.faint} value={text} onChangeText={setText} style={s.composerInput} /><Pressable accessibilityLabel="Post comment" disabled={busy || !text.trim()} onPress={() => act(async () => { await api(`/posts/${post.id}/comments`, 'POST', { text }); setComments(await api(`/posts/${post.id}/comments`)); setText(''); await refresh(); })}><LinearGradient colors={brand} style={[s.sendBtn, !text.trim() && { opacity: .5 }]}><Ionicons name="send" size={18} color="white" /></LinearGradient></Pressable></View></>;
}

export function renderNotifications(ctx: AppCtx) {
  const {
    notifs, openProfile, page
  } = ctx;
  if (!(page === 'notifications')) return null;
  return <View style={s.listCard}>{notifs.map((n, k) => <Pressable key={n.id} style={[s.msgRow, k === notifs.length - 1 && { borderBottomWidth: 0 }]} onPress={() => n.fromId && openProfile(n.fromId)}><View><Photo uri={n.from?.photo} name={n.from?.name} size={48} /><View style={[s.notifIcon, { backgroundColor: n.type === 'gift' ? c.mango : n.type === 'comment' ? c.blue : n.type === 'admin' ? c.teal : c.brand }]}><Ionicons name={n.type === 'gift' ? 'gift' : n.type === 'comment' ? 'chatbubble' : n.type === 'admin' ? 'shield-checkmark' : 'person-add'} size={11} color="white" /></View></View><View style={{ flex: 1, gap: 3 }}><Text style={[s.body, !n.read && { fontWeight: '800' }]}>{n.text}</Text><Text style={s.tiny}>{ago(n.at)}</Text></View></Pressable>)}{!notifs.length && <Empty title="Koi notification nahi" note="Follow, gifts aur comments yahan dikhenge." />}</View>;
}

export function renderVisitors(ctx: AppCtx) {
  const {
    following, openProfile, page, toggleFollow, visitors
  } = ctx;
  if (!(page === 'visitors')) return null;
  return <>{visitors.length ? <View style={s.listCard}>{visitors.map((v, k) => { const isF = following.includes(v.user.id); return <Pressable key={v.user.id} style={[s.msgRow, k === visitors.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openProfile(v.user.id)}><Photo uri={v.user.photo} name={v.user.name} size={50} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { flexWrap: 'wrap' }]}><Text style={s.cardTitle}>{v.user.name}</Text><Level level={v.user.level} gender={v.user.gender} /></View><Text style={s.tiny}>Visited {ago(v.at)}</Text></View><Pressable onPress={() => toggleFollow(v.user.id)} style={[s.followBtn, isF && s.followingBtn]}><Text style={[s.followText, isF && { color: c.muted }]}>{isF ? 'Following' : 'Follow back'}</Text></Pressable></Pressable>; })}</View> : <Empty title="Abhi koi visitor nahi" note="Room join karo aur logon se baat karo, log aapki profile dekhne aayenge." />}</>;
}

export function renderStrangers(ctx: AppCtx) {
  const {
    openDm, page, strangerConvs
  } = ctx;
  if (!(page === 'strangers')) return null;
  return <><Text style={s.bodyMuted}>Jinhe aap follow nahi karte, unke messages yahan aate hain.</Text><View style={s.listCard}>{strangerConvs.map((cv, k) => <Pressable key={cv.user.id} style={[s.msgRow, k === strangerConvs.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openDm(cv.user)}><Photo uri={cv.user.photo} name={cv.user.name} size={50} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.cardTitle, { flex: 1 }]}>{cv.user.name}</Text><Text style={s.tiny}>{ago(cv.lastMessage?.createdAt)}</Text></View><Text style={s.small}>{cv.lastMessage?.text}</Text></View></Pressable>)}</View>{!strangerConvs.length && <Empty title="Koi stranger message nahi" note="" />}</>;
}
