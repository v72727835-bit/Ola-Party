import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthScreen from './AuthScreen';
import { brand, c } from './src/theme';
import { s } from './src/styles';
import { Photo, Tabs } from './src/components/ui';
import type { AppCtx } from './src/state/context';
import { useAppState } from './src/state/useAppState';
import { deriveApp } from './src/state/deriveApp';
import { renderHome } from './src/screens/HomeScreen';
import { renderExplore } from './src/screens/ExploreScreen';
import { renderMessages } from './src/screens/MessagesScreen';
import { renderMe } from './src/screens/MeScreen';
import { renderRoom } from './src/screens/RoomScreen';
import { makeAboutRows, makeHonorGrid } from './src/screens/ProfileParts';
import { renderDetail } from './src/screens/DetailPages';

export default function App() { return <SafeAreaProvider><PartyApp /></SafeAreaProvider>; }

function PartyApp() {
  const app = useAppState();
  const { hydrated } = app;

  if (!hydrated) return <View style={[s.outer, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={c.brand} size="large" /></View>;

  const base = deriveApp(app);
  const ctx: AppCtx = { ...base, aboutRows: makeAboutRows(base), honorGrid: makeHonorGrid(base) };
  const homeScreen = renderHome(ctx);
  const exploreScreen = renderExplore(ctx);
  const messagesScreen = renderMessages(ctx);
  const meScreen = renderMe(ctx);
  const roomScreen = renderRoom(ctx);
  const detail = renderDetail(ctx);
  const {
    act, api, back, busy, connected, dm, error, exploreTab, game, homeTab, insets, leaveRoom, loadCatalog, loading,
    navigate, notice, notifUnread, openWallet, page, q, refresh, room, rooms, saveSession, scrollRef,
    setDescription, setError, setExploreTab, setHomeTab, setNotifUnread, setNotifs, setQ, setRetry, setTab,
    setText, setTitle, tab, token, unread, width
  } = ctx;
  const authScreen = <AuthScreen api={(path, method, body) => api(path, method, body, '')} onSession={saveSession} initialInfo={notice} />;
  const titles: Record<string, string> = { notifications: 'Notifications', visitors: 'Visitors', strangers: 'Stranger messages', 'join-locked': 'Private room', 'room-settings': 'Room settings', 'create-room': 'Start a room', dm: dm?.name || 'Chat', games: 'Games', game: game?.type === 'uno' ? 'UNO' : game?.type === 'ludo' ? 'Ludo' : game?.type === 'connect-four' ? 'Connect Four' : 'Tic-tac-toe', pk: 'PK battle', wallet: 'Wallet', gifts: 'Send a gift', families: 'Families', events: 'Events', tasks: 'Daily rewards', leaderboard: 'Rankings', vip: 'VIP', store: 'Store', 'edit-profile': 'Edit profile', settings: 'Settings', decorations: 'Style shop', lucky: 'Lucky bag', queue: 'Mic queue', user: 'Profile', comments: 'Comments' };
  const navTabs = [{ name: 'Party', icon: 'home-outline', active: 'home' }, { name: 'Explore', icon: 'compass-outline', active: 'compass' }, { name: '+', icon: 'add', active: 'add' }, { name: 'Messages', icon: 'chatbubble-ellipses-outline', active: 'chatbubble-ellipses' }, { name: 'Me', icon: 'person-outline', active: 'person' }] as const;
  const statusBars = <>{!connected && <Pressable accessibilityRole="button" onPress={() => { setRetry(x => x + 1); refresh(); }} style={s.connection}><Ionicons name="cloud-offline" size={18} color="#9A5B00" /><Text style={s.connectionText}>Connecting to server... tap to retry</Text></Pressable>}
    {!!error && <View style={s.errorBar}><Ionicons name="alert-circle" size={20} color={c.red} /><Text accessibilityRole="alert" style={[s.error, { flex: 1 }]}>{error}</Text><Pressable accessibilityLabel="Dismiss error" onPress={() => setError('')}><Ionicons name="close" size={22} color={c.red} /></Pressable></View>}
    {!!notice && <View accessibilityLiveRegion="polite" style={s.notice}><Ionicons name="checkmark-circle" color={c.teal} size={20} /><Text style={s.noticeText}>{notice}</Text></View>}
    {busy && <View style={s.progress}><ActivityIndicator size="small" color={c.brand} /></View>}</>;

  const mainHeader = tab === 'Party' ? <View style={[s.header, { paddingTop: insets.top + 10 }]}><View style={[s.row, { justifyContent: 'space-between' }]}><Tabs big items={['Follow', 'Live', 'Party']} value={homeTab} onChange={setHomeTab} /><View style={[s.row, { gap: 16 }]}><Pressable accessibilityLabel="Rankings" onPress={() => loadCatalog('leaderboard')}><LinearGradient colors={['#FFC23C', '#FF7A1A']} style={s.headerBadge}><MaterialCommunityIcons name="crown" size={19} color="white" /></LinearGradient></Pressable><Pressable accessibilityLabel="Wallet" onPress={openWallet}><Ionicons name="wallet-outline" size={25} color={c.ink} /></Pressable><Pressable accessibilityLabel="Refresh" onPress={refresh}><Ionicons name="refresh" size={24} color={c.ink} /></Pressable></View></View><View style={s.search}><Ionicons name="search" color={c.faint} size={19} /><TextInput accessibilityLabel="Search rooms" placeholder="Search rooms or room ID" placeholderTextColor={c.faint} value={q} onChangeText={setQ} style={s.searchInput} /></View></View>
    : tab === 'Explore' ? <View style={[s.header, { paddingTop: insets.top + 10 }]}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.bigTitle}>Explore</Text><Pressable accessibilityLabel="Refresh" onPress={refresh}><Ionicons name="refresh" size={24} color={c.ink} /></Pressable></View><Tabs items={['Square', 'People']} value={exploreTab} onChange={setExploreTab} /></View>
    : tab === 'Messages' ? <View style={[s.header, { paddingTop: insets.top + 10, paddingBottom: 12 }]}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.bigTitle}>Messages</Text><View style={[s.row, { gap: 16 }]}><Pressable accessibilityLabel="Notifications" onPress={() => act(async () => { setNotifs(await api('/me/notifications')); navigate('notifications'); if (notifUnread) { api('/me/notifications/read', 'POST', {}).catch(() => {}); setNotifUnread(0); } })}><Ionicons name="notifications-outline" size={25} color={c.ink} />{notifUnread > 0 && <View style={s.navBadge}><Text style={s.navBadgeText}>{notifUnread}</Text></View>}</Pressable><Pressable accessibilityLabel="Refresh" onPress={refresh}><Ionicons name="refresh" size={24} color={c.ink} /></Pressable></View></View></View> : null;

  const inRoom = !!(token && page === 'room' && room);
  return <View style={s.outer}><StatusBar style={inRoom || (token && !page && tab === 'Me') ? 'light' : 'dark'} /><View style={[s.shell, page === 'games' && { backgroundColor: '#100e17' }, inRoom && { backgroundColor: '#0E0726' }]}>{!token ? authScreen : inRoom ? roomScreen : <>
    {page ? <View style={[s.appBar, { paddingTop: insets.top + 6 }, page === 'games' && { backgroundColor: '#15111f', borderColor: '#ffffff12' }]}><Pressable accessibilityLabel="Go back" onPress={back} style={s.back}><Ionicons name="chevron-back" size={26} color={page === 'games' ? '#eee8f5' : c.ink} /></Pressable><Text style={[s.barTitle, page === 'games' && { color: '#eee8f5' }]} numberOfLines={1}>{titles[page]}</Text><View style={{ width: 42 }} /></View> : mainHeader}
    {statusBars}
    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={[!page && tab === 'Me' ? { paddingBottom: 30 } : s.content, !!page && { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">{loading && !page && tab === 'Party' && !rooms.length && <ActivityIndicator style={{ marginVertical: 25 }} color={c.brand} />}{page ? detail : tab === 'Party' ? homeScreen : tab === 'Explore' ? exploreScreen : tab === 'Messages' ? messagesScreen : meScreen}</ScrollView>
    {room && <Pressable accessibilityLabel="Back to room" onPress={() => navigate('room')} style={[s.floatRoom, { bottom: page ? insets.bottom + 20 : Math.max(insets.bottom, 8) + 78 }]}><Photo uri={room.cover} name={room.title} size={50} radius={14} /><View style={s.floatEq}><MaterialCommunityIcons name="equalizer" size={14} color="white" /></View><Pressable accessibilityLabel="Leave room" onPress={leaveRoom} style={s.floatClose}><Ionicons name="close" size={14} color="white" /></Pressable></Pressable>}
    {!page && <View style={[s.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>{navTabs.map(t => { if (t.name === '+') return <Pressable key="+" accessibilityLabel="Start a room" style={s.navItem} onPress={() => { setTitle(''); setDescription(''); navigate('create-room'); }}><LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.navPlus}><Ionicons name="add" size={30} color="white" /></LinearGradient></Pressable>; const on = tab === t.name; return <Pressable accessibilityRole="tab" accessibilityLabel={t.name} accessibilityState={{ selected: on }} key={t.name} style={s.navItem} onPress={() => { setTab(t.name); setText(''); }}><View><Ionicons name={on ? t.active : t.icon} size={26} color={on ? c.brand : '#4B4763'} />{t.name === 'Messages' && unread > 0 && <View style={s.navBadge}><Text style={s.navBadgeText}>{unread}</Text></View>}</View><Text style={[s.navLabel, on && { color: c.brand, fontWeight: '800' }]}>{t.name}</Text></Pressable>; })}</View>}
  </>}</View>{Platform.OS === 'web' && width > 1060 && <View style={s.desktopNote}><Text style={s.desktopLogo}>Party App</Text><Text style={s.desktopText}>Live voice rooms.{'\n'}Real people.</Text></View>}</View>;
}
