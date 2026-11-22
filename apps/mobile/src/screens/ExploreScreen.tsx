import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { s } from '../styles';
import { Empty, Heading, Level, Photo } from '../components/ui';
import { brand, c } from '../theme';
import { ago, firstName } from '../utils';
import type { AppCtx } from '../state/context';

export function renderExplore(ctx: AppCtx) {
  const {
    act, allPeople, api, busy, enterRoom, exploreTab, following, found, navigate, openProfile, people, peopleQ,
    posts, refresh, rooms, setComments, setNotice, setPeopleQ, setPost, setText, text, toggleFollow, user
  } = ctx;
  return exploreTab === 'Square' ? <>
    <View style={s.compose}><Photo uri={user?.photo} name={user?.name} size={42} /><TextInput accessibilityLabel="Write a post" value={text} onChangeText={setText} placeholder="Share something with everyone..." placeholderTextColor={c.faint} multiline style={s.composeInput} /><Pressable accessibilityLabel="Post" disabled={busy || !text.trim()} onPress={() => act(async () => { await api('/posts', 'POST', { text }); setText(''); await refresh(); setNotice('Post share ho gaya.'); })}><LinearGradient colors={brand} style={[s.sendBtn, !text.trim() && { opacity: .5 }]}><Ionicons name="send" size={18} color="white" /></LinearGradient></Pressable></View>
    {posts.map(p => { const liked = p.likes?.includes(user?.id); const isF = following.includes(p.author?.id); return <View key={p.id} style={s.post}>
      <Pressable style={s.row} onPress={() => openProfile(p.author.id)}><Photo uri={p.author?.photo} name={p.author?.name} size={46} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { flexWrap: 'wrap' }]}><Text style={s.cardTitle}>{p.author?.name}</Text><Level level={p.author?.level} gender={p.author?.gender} /></View><Text style={s.tiny}>{ago(p.createdAt)}</Text></View>{p.author?.id !== user?.id && <Pressable onPress={() => toggleFollow(p.author.id)} style={[s.followBtn, isF && s.followingBtn]}><Text style={[s.followText, isF && { color: c.muted }]}>{isF ? 'Following' : 'Follow'}</Text></Pressable>}</Pressable>
      <Text style={[s.body, { marginVertical: 12 }]}>{p.text}</Text>
      <View style={[s.row, { gap: 24 }]}>
        <Pressable style={s.inline} onPress={() => act(async () => { await api(`/posts/${p.id}/like`, liked ? 'DELETE' : 'POST', {}); await refresh(); })}><Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? c.brand : c.muted} /><Text style={s.actionText}>{p.likes?.length || 0}</Text></Pressable>
        <Pressable style={s.inline} onPress={() => act(async () => { setComments(await api(`/posts/${p.id}/comments`)); setPost(p); navigate('comments'); })}><Ionicons name="chatbubble-outline" size={20} color={c.muted} /><Text style={s.actionText}>{p.commentCount || 0}</Text></Pressable>
      </View>
    </View>; })}
    {!posts.length && <Empty title="Abhi tak koi post nahi" note="Pehla post aap karo." />}
  </> : <>
    <LinearGradient colors={['#FF2E74', '#8B3DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.partyCard}><Text style={s.partyCardTitle}>Party</Text><Text style={s.partyCardSub}>People talking right now. Tap to join them.</Text><View style={s.partyFaces}>{Object.values(allPeople).filter(p => p.id !== user?.id).slice(0, 8).map((p, i) => <Pressable key={p.id} onPress={() => { const r = rooms.find(rr => rr.members?.includes(p.id)); if (r) enterRoom(r); }} style={{ alignItems: 'center', width: '25%', marginTop: i % 2 ? 14 : 0 }}><Photo uri={p.photo} name={p.name} size={54} ring ringColors={['#FFFFFF', '#FFE08A']} /><Text style={s.faceName}>{firstName(p.name)}</Text></Pressable>)}</View></LinearGradient>
    <View style={[s.search, { backgroundColor: 'white', marginBottom: 12 }]}><Ionicons name="search" color={c.faint} size={19} /><TextInput accessibilityLabel="Search people" placeholder="Search people by name or city" placeholderTextColor={c.faint} value={peopleQ} onChangeText={setPeopleQ} style={s.searchInput} /></View>
    {!!peopleQ.trim() && <View style={s.listCard}>{found.map((p, k) => { const isF = following.includes(p.id); return <Pressable key={p.id} style={[s.msgRow, k === found.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openProfile(p.id)}><Photo uri={p.photo} name={p.name} size={48} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { flexWrap: 'wrap' }]}><Text style={s.cardTitle}>{p.name}</Text><Level level={p.level} gender={p.gender} /></View>{!!p.hometown && <Text style={s.small}>{p.hometown}</Text>}</View><Pressable onPress={() => toggleFollow(p.id)} style={[s.followBtn, isF && s.followingBtn]}><Text style={[s.followText, isF && { color: c.muted }]}>{isF ? 'Following' : 'Follow'}</Text></Pressable></Pressable>; })}{!found.length && <Text style={[s.small, { paddingVertical: 14 }]}>Koi nahi mila.</Text>}</View>}
    <Heading title="Recommended" note="People you might like" />
    <View style={s.listCard}>{people.filter(p => p.id !== user?.id).map((p, k, all) => { const isF = following.includes(p.id); return <Pressable key={p.id} style={[s.msgRow, k === all.length - 1 && { borderBottomWidth: 0 }]} onPress={() => openProfile(p.id)}><Photo uri={p.photo} name={p.name} size={56} ring={p.vip} /><View style={{ flex: 1, gap: 4 }}><View style={[s.row, { flexWrap: 'wrap' }]}><Text style={s.cardTitle}>{p.name}</Text><Level level={p.level} gender={p.gender} /></View><Text style={s.small}>{p.bio || 'New user'}</Text></View><Pressable onPress={() => toggleFollow(p.id)} style={[s.followBtn, isF && s.followingBtn]}><Text style={[s.followText, isF && { color: c.muted }]}>{isF ? 'Following' : 'Follow'}</Text></Pressable></Pressable>; })}</View>
  </>;
}
