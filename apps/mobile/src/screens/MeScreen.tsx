import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { s } from '../styles';
import { Button, Coin, Diamond, Empty, Level, Photo, Tabs } from '../components/ui';
import { ago, shortId } from '../utils';
import { c } from '../theme';
import type { AppCtx } from '../state/context';

export function renderMe(ctx: AppCtx) {
  const {
    aboutRows, following, honorGrid, insets, loadCatalog, meTab, navigate, openEdit, openWallet, posts, setMeTab,
    user
  } = ctx;
  const friends = following.filter(id => user?.followers?.includes(id)).length;
  const myPosts = posts.filter(p => p.author?.id === user?.id);
  return <>
    <LinearGradient colors={['#FF2E74', '#8B3DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.meHead, { paddingTop: insets.top + 14 }]}>
      <View style={s.meGlow} />
      <View style={[s.row, { justifyContent: 'flex-end', gap: 12 }]}><Pressable accessibilityLabel="Edit profile" style={s.glassBtn} onPress={() => { openEdit(); }}><Ionicons name="create-outline" size={20} color="white" /></Pressable><Pressable accessibilityLabel="Settings" style={s.glassBtn} onPress={() => navigate('settings')}><Ionicons name="settings-outline" size={20} color="white" /></Pressable></View>
      <View style={[s.row, { gap: 14, marginTop: 6 }]}><Photo uri={user?.photo} name={user?.name} size={84} ring ringColors={['#FFFFFF', '#FFE08A']} /><View style={{ flex: 1, gap: 6 }}><View style={[s.row, { flexWrap: 'wrap' }]}><Text style={s.meName}>{user?.name}</Text><Level level={user?.level} gender={user?.gender} /></View><Text style={s.meId}>ID: {shortId(user?.id)}</Text>{user?.vip && <View style={s.vipTag}><MaterialCommunityIcons name="crown" size={13} color="#7A4A00" /><Text style={s.vipTagText}>VIP</Text></View>}</View></View>
    </LinearGradient>
    <View style={s.meBody}>
      <View style={s.statsRow}>{([['Followers', user?.followers?.length ?? 0], ['Following', following.length], ['Friends', friends]] as [string, number][]).map(([l, n]) => <View key={l} style={s.stat}><Text style={s.statNum}>{n}</Text><Text style={s.statLabel}>{l}</Text></View>)}</View>
      <View style={[s.row, { gap: 10 }]}><Pressable style={{ flex: 1 }} onPress={() => loadCatalog('families')}><LinearGradient colors={['#FFE1EC', '#FFF4F8']} style={s.miniCard}><Text style={s.miniTitle}>Family</Text><Text style={s.small}>Join a crew</Text></LinearGradient></Pressable><Pressable style={{ flex: 1 }} onPress={() => loadCatalog('leaderboard')}><LinearGradient colors={['#FFF0CC', '#FFF9EB']} style={s.miniCard}><Text style={s.miniTitle}>Rankings</Text><Text style={s.small}>This week</Text></LinearGradient></Pressable></View>
      <Pressable onPress={openWallet} style={s.walletCard}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.cardTitle}>Wallet</Text><View style={s.row}><Coin n={user?.coins ?? 0} /><Diamond n={user?.diamonds ?? 0} /><Ionicons name="chevron-forward" size={18} color={c.faint} /></View></View>
        <View style={[s.row, { gap: 10, marginTop: 12 }]}><Pressable style={s.walletTile} onPress={() => loadCatalog('vip')}><MaterialCommunityIcons name="crown" size={26} color={c.gold} /><View><Text style={s.menuText}>VIP</Text><Text style={s.tiny}>{user?.vip ? 'Active' : 'Not active'}</Text></View></Pressable><Pressable style={s.walletTile} onPress={() => loadCatalog('decorations')}><MaterialCommunityIcons name="shield-crown" size={26} color={c.violet} /><View><Text style={s.menuText}>Style shop</Text><Text style={s.tiny}>Frames, badges</Text></View></Pressable></View>
      </Pressable>
      <View style={{ marginTop: 18, marginBottom: 6 }}><Tabs items={['About me', 'Honor', 'Posts']} value={meTab} onChange={setMeTab} /></View>
      {meTab === 'About me' ? <View style={{ gap: 14, paddingVertical: 8 }}><Text style={s.body}>{user?.bio || 'Introduce yourself in a few words.'}</Text>{aboutRows(user)}<Button title="Edit details" soft onPress={openEdit} /><Button title="Daily rewards" soft onPress={() => loadCatalog('tasks')} /></View>
        : meTab === 'Honor' ? honorGrid
        : <>{myPosts.map(p => <View key={p.id} style={s.post}><Text style={s.tiny}>{ago(p.createdAt)}</Text><Text style={[s.body, { marginTop: 6 }]}>{p.text}</Text></View>)}{!myPosts.length && <Empty title="No posts yet" note="Explore tab se apna pehla post share karo." />}</>}
    </View>
  </>;
}
