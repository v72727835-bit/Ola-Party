import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, useWindowDimensions, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { connectAudio, AudioConnection } from './audio';

type Item = Record<string, any>;
type Icon = React.ComponentProps<typeof Ionicons>['name'];
const API = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

// Colours: warm pink, violet and mango on a soft blush background.
const c = {
  ink: '#1D1238', text: '#3B3258', muted: '#6E6787', faint: '#8F89A6', bg: '#FFF6FA', card: '#FFFFFF', line: '#F0E4F0',
  pink: '#FF3D7F', violet: '#7B2FF7', mango: '#FF9F1C', teal: '#00B89C', blue: '#3D7BFF', yellow: '#FFC93C', red: '#E5484D',
};
const brand: [string, string, string] = ['#FF3D7F', '#B23BF5', '#7B2FF7'];
const sunset: [string, string] = ['#FF9F1C', '#FF3D7F'];
const covers: [string, string][] = [['#FF5E8A', '#FF9F1C'], ['#7B5CFF', '#C850C0'], ['#FF9F1C', '#FF5E62'], ['#00B894', '#0984E3'], ['#E84393', '#6C5CE7'], ['#0984E3', '#00CEC9'], ['#6C5CE7', '#A29BFE'], ['#FD7E14', '#E84393']];
const tints = ['#FFE3EE', '#EDE3FF', '#FFF0D9', '#DDF7F1', '#E2ECFF', '#FFF6D6'];
const roomArt: Record<string, string> = { Chat: '☕', Music: '🎶', Friends: '💬', Gaming: '🎮', Chill: '🌙' };
const hash = (s = '') => [...s].reduce((a, ch) => a + ch.charCodeAt(0), 0);
const isEmoji = (s?: string) => !!s && /\p{Extended_Pictographic}/u.test(s);
const initials = (s?: string) => (s || 'P').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
const firstName = (s?: string) => (s || 'friend').split(' ')[0];
const ago = (iso?: string) => { if (!iso) return ''; const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000)); if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`; const d = Math.round(h / 24); return d === 1 ? 'yesterday' : `${d} days ago`; };
const when = (iso?: string) => { if (!iso) return 'Date coming soon'; const d = new Date(iso); return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };

function Button({ title, onPress, soft = false, disabled = false, icon, small = false }: { title: string; onPress: () => void; soft?: boolean; disabled?: boolean; icon?: Icon; small?: boolean }) {
  const inner = <>{icon && <Ionicons name={icon} size={small ? 16 : 19} color={soft ? c.violet : 'white'} />}<Text style={[s.buttonText, small && { fontSize: 14 }, soft && { color: c.violet }]}>{title}</Text></>;
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [{ opacity: disabled ? .45 : pressed ? .85 : 1 }]}>
    {soft ? <View style={[s.button, small && s.buttonSmall, s.softButton]}>{inner}</View> : <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.button, small && s.buttonSmall]}>{inner}</LinearGradient>}
  </Pressable>;
}
function Avatar({ name, emoji, size = 46, ring = false }: { name?: string; emoji?: string; size?: number; ring?: boolean }) {
  const bg = tints[hash(name) % tints.length];
  const face = <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>{isEmoji(emoji) ? <Text style={{ fontSize: size * .5 }}>{emoji}</Text> : <Text style={{ fontSize: size * .36, fontWeight: '800', color: c.violet }}>{initials(name)}</Text>}</View>;
  return ring ? <LinearGradient colors={sunset} style={{ padding: 3, borderRadius: size }}>{face}</LinearGradient> : face;
}
function Field({ label, value, onChangeText, secure = false, multiline = false, placeholder = '' }: { label: string; value: string; onChangeText: (v: string) => void; secure?: boolean; multiline?: boolean; placeholder?: string }) {
  return <View style={{ gap: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} secureTextEntry={secure} multiline={multiline} placeholder={placeholder} placeholderTextColor={c.faint} style={[s.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]} autoCapitalize={label.toLowerCase().includes('email') ? 'none' : 'sentences'} /></View>;
}
function Heading({ title, note, action, actionLabel = 'Refresh' }: { title: string; note?: string; action?: () => void; actionLabel?: string }) {
  return <View style={s.sectionHead}><View style={{ flex: 1 }}><Text style={s.sectionTitle}>{title}</Text>{note && <Text style={s.small}>{note}</Text>}</View>{action && <Pressable accessibilityRole="button" onPress={action} style={s.linkPill}><Text style={s.link}>{actionLabel}</Text></Pressable>}</View>;
}
function Empty({ icon, title, note }: { icon: Icon; title: string; note: string }) {
  return <View style={s.empty}><View style={s.emptyIcon}><Ionicons name={icon} size={34} color={c.pink} /></View><Text style={s.cardTitle}>{title}</Text><Text style={[s.small, { textAlign: 'center' }]}>{note}</Text></View>;
}
function Tile({ icon, color, bg }: { icon: Icon; color: string; bg: string }) { return <View style={[s.tile, { backgroundColor: bg }]}><Ionicons name={icon} size={24} color={color} /></View>; }

export default function App() { return <SafeAreaProvider><PartyApp /></SafeAreaProvider>; }

function PartyApp() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [token, setToken] = useState(''); const [user, setUser] = useState<Item | null>(null); const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState('Party'); const [page, setPage] = useState(''); const [rooms, setRooms] = useState<Item[]>([]); const [posts, setPosts] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<Record<string, Item[]>>({}); const [room, setRoom] = useState<Item | null>(null); const [messages, setMessages] = useState<Item[]>([]);
  const [dm, setDm] = useState<Item | null>(null); const [conversations, setConversations] = useState<Item[]>([]); const [wallet, setWallet] = useState<Item | null>(null);
  const [q, setQ] = useState(''); const [category, setCategory] = useState('All'); const [notice, setNotice] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false); const [retry, setRetry] = useState(0); const socket = useRef<Socket | null>(null);
  const [newPassword, setNewPassword] = useState(''); const [phone, setPhone] = useState(''); const [otp, setOtp] = useState(''); const [usePhone, setUsePhone] = useState(false); const [bags, setBags] = useState<Item[]>([]); const [bagTotal, setBagTotal] = useState('100'); const [bagCount, setBagCount] = useState('5'); const [queue, setQueue] = useState<Item[]>([]); const [deleteArmed, setDeleteArmed] = useState(false); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [register, setRegister] = useState(false);
  const [text, setText] = useState(''); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [formCategory, setFormCategory] = useState('Chill');
  const [selectedGift, setSelectedGift] = useState<Item | null>(null); const [recipient, setRecipient] = useState(''); const [profile, setProfile] = useState<Item | null>(null); const [comments, setComments] = useState<Item[]>([]); const [post, setPost] = useState<Item | null>(null);
  const audioRef = useRef<AudioConnection | null>(null); const [audioConnected, setAudioConnected] = useState(false); const [micOn, setMicOn] = useState(false);
  const [game, setGame] = useState<Item | null>(null); const [battle, setBattle] = useState<Item | null>(null);
  const [pendingRoom, setPendingRoom] = useState<Item | null>(null);
  const activeChat = useRef<{ page: string; roomId?: string; peerId?: string; userId?: string }>({ page: '' });
  const giftKeyRef = useRef<{ intent: string; key: string } | null>(null);
  const giftRequestKey = (giftId: string, recipientId: string, roomId?: string) => { const intent = JSON.stringify([giftId, recipientId, roomId]); if (giftKeyRef.current?.intent !== intent) giftKeyRef.current = { intent, key: `gift-${Date.now()}-${Math.random().toString(36).slice(2)}` }; return giftKeyRef.current.key; };
  activeChat.current = { page, roomId: room?.id, peerId: dm?.id, userId: user?.id };
  const stopAudio = async () => { const audio = audioRef.current; audioRef.current = null; setAudioConnected(false); setMicOn(false); if (audio) await audio.disconnect(); };

  const api = useCallback(async (path: string, method = 'GET', body?: Item, auth = token) => {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
    try { const res = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal });
      const json = await res.json(); if (!res.ok) { if (res.status === 401 && auth) { await AsyncStorage.removeItem('melo-session'); socket.current?.disconnect(); setToken(''); setUser(null); setRoom(null); setDm(null); setMessages([]); setPage(''); setNotice('Session khatam ho gaya. Please dobara sign in karo.'); } throw new Error(json.error?.message || `Request failed (${res.status})`); } return json.data;
    } catch (e: any) { if (e.name === 'AbortError' || e.message === 'Failed to fetch' || e.message === 'Network request failed') throw new Error('Server se connect nahi ho paya. Internet check karo aur dobara try karo — server jaagne mein kabhi 50 second lagte hain.'); throw e; } finally { clearTimeout(timeout); }
  }, [token]);
  const act = async (fn: () => Promise<void>) => { if (busy) return; setBusy(true); setError(''); try { await fn(); } catch (e: any) { setError(e.message); } finally { setBusy(false); } };
  const refresh = useCallback(async () => { if (!token) return; setLoading(true); setError(''); try { const results = await Promise.allSettled([api('/rooms'), api('/posts'), api('/me'), api('/conversations')]); const [r, p, me, c] = results; if (r.status === 'fulfilled') setRooms(r.value); if (p.status === 'fulfilled') setPosts(p.value); if (me.status === 'fulfilled') setUser(me.value); if (c.status === 'fulfilled') setConversations(c.value); const failed = results.find(x => x.status === 'rejected') as PromiseRejectedResult | undefined; if (failed) setError(failed.reason?.message || 'Kuch cheezein load nahi hui. Refresh dabao.'); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [api, token]);
  useEffect(() => { AsyncStorage.getItem('melo-session').then(v => { if (v) { try { const data = JSON.parse(v); setToken(data.token); setUser(data.user); } catch {} } }).finally(() => setHydrated(true)); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (!token) return; const client = io(API.replace(/\/api$/, ''), { auth: { token }, reconnectionAttempts: Infinity, reconnectionDelayMax: 10000 }); socket.current = client;
    client.on('connect', () => setConnected(true)); client.on('disconnect', () => setConnected(false)); client.on('connect_error', () => setConnected(false));
    client.on('room:updated', (r: Item) => { setRooms(prev => prev.map(x => x.id === r.id ? r : x)); setRoom(prev => prev?.id === r.id ? r : prev); });
    const add = (m: Item) => { const active = activeChat.current; const belongs = m.roomId ? active.page === 'room' && m.roomId === active.roomId : active.page === 'dm' && ((m.fromId === active.peerId && m.toId === active.userId) || (m.fromId === active.userId && m.toId === active.peerId)); if (belongs) setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]); };
    client.on('room:message', add); client.on('dm:message', (m: Item) => { add(m); api('/conversations').then(setConversations).catch(() => {}); });
    client.on('wallet:updated', (w: Item) => { setUser(prev => prev ? { ...prev, ...w } : prev); setWallet(prev => prev ? { ...prev, ...w } : prev); });
    client.on('gift:sent', () => setNotice('Kisi ne gift bheja! ✨')); client.on('room:queue', (q: Item[]) => setQueue(q)); client.on('room:lucky-bag', () => setNotice('Lucky bag aaya hai! Jaldi grab karo 🧧'));
    client.on('game:updated', (g: Item) => setGame(prev => prev?.id === g.id ? g : prev));
    client.on('pk:updated', () => setNotice('PK battle update hua — score dekho ⚡'));
    return () => { client.disconnect(); socket.current = null; };
  }, [token, retry]);
  useEffect(() => { if (room && connected) socket.current?.emit('room:subscribe', room.id); }, [room?.id, connected]);
  const currentSeat = room?.seats?.find((seat: Item) => seat.userId === user?.id);
  useEffect(() => { if (!audioRef.current) return; stopAudio().catch(() => {}); }, [room?.id, currentSeat?.index, currentSeat?.muted, room?.members?.includes(user?.id)]);
  useEffect(() => () => { audioRef.current?.disconnect().catch(() => {}); }, []);
  useEffect(() => { if (!token) stopAudio().catch(() => {}); }, [token]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(t); }, [notice]);

  const authenticate = (demo = false) => act(async () => { const data = await api(demo ? '/auth/demo' : register ? '/auth/register' : '/auth/login', 'POST', demo ? {} : { email, password, name }); await AsyncStorage.setItem('melo-session', JSON.stringify(data)); setUser(data.user); setToken(data.token); setPassword(''); });
  const navigate = (p: string) => { setPage(p); setText(''); setError(''); };
  const loadCatalog = (p: string) => act(async () => { const key = p === 'leaderboard' ? 'rankings' : p; const data = await api('/' + key); setCatalog(prev => ({ ...prev, [p]: Array.isArray(data) ? data : data?.items || data?.plans || [] })); navigate(p); });
  const openWallet = () => act(async () => { setWallet(await api('/wallet')); navigate('wallet'); });
  const enterRoom = (r: Item, roomPassword?: string) => act(async () => { if (r.locked && r.ownerId !== user?.id && roomPassword === undefined) { setPendingRoom(r); setPassword(''); navigate('join-locked'); return; } await api(`/rooms/${r.id}/join`, 'POST', { password: roomPassword }); if (room && room.id !== r.id) { await api(`/rooms/${room.id}/leave`, 'POST', {}); await stopAudio(); } const current = await api(`/rooms/${r.id}`); setRoom(current); setDm(null); setMessages(await api(`/rooms/${r.id}/messages`)); navigate('room'); });
  const leaveRoom = () => act(async () => { await api(`/rooms/${room!.id}/leave`, 'POST', {}); await stopAudio(); setRoom(null); navigate(''); await refresh(); });
  const openDm = (u: Item) => act(async () => { setMessages(await api(`/users/${u.id}/messages`)); setDm(u); navigate('dm'); });
  const sendMessage = () => act(async () => { if (!text.trim()) return; const m = await api(page === 'dm' ? `/users/${dm!.id}/messages` : `/rooms/${room!.id}/messages`, 'POST', { text }); setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]); setText(''); });
  const seatAction = (index: number, action: string) => act(async () => { await api(`/rooms/${room!.id}/seats/${index}`, 'POST', { action }); setRoom(await api(`/rooms/${room!.id}`)); });
  const openProfile = (id: string) => act(async () => { setProfile(await api(`/users/${id}`)); setDescription(''); navigate('user'); });
  const joinAudio = () => act(async () => { if (audioConnected) { await stopAudio(); return; } const credentials = await api(`/rooms/${room!.id}/rtc-token`, 'POST', {}); audioRef.current = await connectAudio(credentials.url, credentials.token, () => { audioRef.current = null; setAudioConnected(false); setMicOn(false); }); setAudioConnected(true); setNotice('Audio connected. Mic abhi off hai.'); });
  const toggleMic = () => act(async () => { if (!currentSeat || currentSeat.muted) throw new Error('Pehle ek khali seat lo. Host ne seat mute ki ho to bol nahi paoge.'); if (!audioRef.current) throw new Error('Pehle live audio connect karo.'); await audioRef.current.setMicrophone(!micOn); setMicOn(!micOn); });
  const goHome = () => { navigate(''); setDm(null); };
  const featureButtons: { icon: Icon; name: string; key: string; color: string; bg: string }[] = [{ icon: 'trophy', name: 'Rankings', key: 'leaderboard', color: c.mango, bg: '#FFF0D9' }, { icon: 'people', name: 'Families', key: 'families', color: c.violet, bg: '#EDE3FF' }, { icon: 'calendar', name: 'Events', key: 'events', color: c.pink, bg: '#FFE3EE' }, { icon: 'gift', name: 'Rewards', key: 'tasks', color: c.teal, bg: '#DDF7F1' }, { icon: 'sparkles', name: 'Style', key: 'decorations', color: c.blue, bg: '#E2ECFF' }];
  const filteredRooms = rooms.filter(r => (category === 'All' || r.category?.toLowerCase() === category.toLowerCase()) && `${r.title} ${r.description} ${r.category}`.toLowerCase().includes(q.toLowerCase()));
  const back = page === 'room' ? leaveRoom : room && ['games', 'game', 'pk', 'gifts', 'user', 'room-settings', 'queue', 'lucky'].includes(page) ? () => navigate('room') : goHome;


  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [page, tab]);
  const peopleMap: Record<string, Item> = {}; for (const p of room?.people || []) peopleMap[p.id] = p;
  const nameOf = (id: string) => id === user?.id ? 'You' : peopleMap[id]?.name || 'Guest';
  const emojiOf = (id: string) => id === user?.id ? user?.avatar : peopleMap[id]?.avatar;
  const liveCount = rooms.reduce((n, r) => n + (r.members?.length || 0), 0);
  const onlinePeople: Item[] = []; for (const r of rooms) for (const p of r.people || []) if (!onlinePeople.some(x => x.id === p.id) && p.id !== user?.id) onlinePeople.push({ ...p, roomTitle: r.title, room: r });

  if (!hydrated) return <View style={[s.outer, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={c.pink} size="large" /></View>;

  const authScreen = <ScrollView contentContainerStyle={[s.auth, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">
    <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.brandIcon}><Ionicons name="mic" size={38} color="white" /></LinearGradient>
    <Text style={s.wordmark}>Party App</Text>
    <Text style={s.authTitle}>Baatein, gaane{'\n'}aur naye dost 🎉</Text>
    <Text style={s.authNote}>Live voice rooms where people actually talk. Jump in, grab a seat, say hi.</Text>
    <View style={s.authCard}>
      <Text style={s.sectionTitle}>{register ? 'Create your account' : 'Welcome back!'}</Text>
      {register && <Field label="Your name" value={name} onChangeText={setName} placeholder="What should people call you?" />}
      {usePhone ? <><Field label="Phone number (with country code)" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" /><Button title="Send code" soft disabled={busy || phone.length < 8} onPress={() => act(async () => { const r = await api('/auth/otp/request', 'POST', { phone }); setNotice(r.devCode ? `Test code: ${r.devCode} (demo mode)` : 'Code bhej diya.'); })} /><Field label="6-digit code" value={otp} onChangeText={setOtp} placeholder="000000" /><Button title={busy ? 'Please wait…' : 'Verify & continue'} icon="arrow-forward" disabled={busy || otp.length !== 6} onPress={() => act(async () => { const data = await api('/auth/otp/verify', 'POST', { phone, code: otp }); await AsyncStorage.setItem('melo-session', JSON.stringify(data)); setUser(data.user); setToken(data.token); setOtp(''); })} /></>
        : <><Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" /><Field label="Password" value={password} onChangeText={setPassword} secure placeholder="At least 8 characters" /><Button title={busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} icon="arrow-forward" onPress={() => authenticate()} disabled={busy} /></>}
      <Pressable onPress={() => setUsePhone(!usePhone)}><Text style={[s.link, { textAlign: 'center' }]}>{usePhone ? 'Use email instead' : 'Use phone number instead'}</Text></Pressable>
      <Pressable onPress={() => setRegister(!register)}><Text style={[s.link, { textAlign: 'center' }]}>{register ? 'Already have an account? Sign in' : "New here? Create an account"}</Text></Pressable>
      <View style={s.divider} />
      <Button title="Try it with a guest account" icon="sparkles" soft onPress={() => authenticate(true)} disabled={busy} />
      <Text style={[s.tiny, { textAlign: 'center' }]}>Guest accounts get 500 test coins. No real money is used.</Text>
    </View>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </ScrollView>;

  const homeScreen = <>
    <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
      <View style={s.heroBlobA} /><View style={s.heroBlobB} />
      <View style={s.row}><View style={s.liveTag}><View style={s.liveDot} /><Text style={s.liveText}>{liveCount} people live right now</Text></View></View>
      <Text style={s.heroTitle}>Aaj ki party{'\n'}kahan hai? 🎉</Text>
      <Text style={s.heroSub}>Pick a room, grab a seat and start talking.</Text>
      <View style={[s.row, { marginTop: 18 }]}>
        <Pressable style={s.heroButton} onPress={() => { setTitle(''); setDescription(''); navigate('create-room'); }}><Ionicons name="add-circle" size={20} color={c.pink} /><Text style={s.heroButtonText}>Start a room</Text></Pressable>
        <Pressable style={s.heroGhost} onPress={openWallet}><Text style={s.heroGhostText}>🪙 {user?.coins ?? 0}</Text></Pressable>
      </View>
    </LinearGradient>

    <View style={s.shortcuts}>{featureButtons.map(f => <Pressable key={f.key} style={s.shortcut} onPress={() => loadCatalog(f.key)}><View style={[s.shortcutIcon, { backgroundColor: f.bg }]}><Ionicons name={f.icon} size={26} color={f.color} /></View><Text style={s.shortcutLabel}>{f.name}</Text></Pressable>)}</View>

    {onlinePeople.length > 0 && <><Heading title="Online now" note="Tap someone to join their room" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 6, paddingRight: 10 }}>{onlinePeople.slice(0, 12).map(p => <Pressable key={p.id} style={s.onlineItem} onPress={() => enterRoom(p.room)}><View><Avatar name={p.name} emoji={p.avatar} size={60} ring /><View style={s.onlineDot} /></View><Text style={s.onlineName}>{firstName(p.name)}</Text></Pressable>)}</ScrollView></>}

    <View style={{ height: 18 }} />
    <Heading title="Live rooms" note={`${rooms.length} rooms open`} action={refresh} />
    <View style={s.search}><Ionicons name="search" color={c.faint} size={21} /><TextInput accessibilityLabel="Search rooms" placeholder="Search rooms or topics" placeholderTextColor={c.faint} value={q} onChangeText={setQ} style={s.searchInput} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{['All', 'Chat', 'Music', 'Friends', 'Gaming', 'Chill'].map(cat => <Pressable key={cat} onPress={() => setCategory(cat)}>{category === cat ? <LinearGradient colors={sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.chip}><Text style={[s.chipText, { color: 'white' }]}>{cat === 'All' ? '🔥 All' : `${roomArt[cat] || ''} ${cat}`}</Text></LinearGradient> : <View style={[s.chip, s.chipIdle]}><Text style={s.chipText}>{cat === 'All' ? '🔥 All' : `${roomArt[cat] || ''} ${cat}`}</Text></View>}</Pressable>)}</ScrollView>

    {filteredRooms.map((r, i) => { const seated = (r.seats || []).filter((x: Item) => x.userId); const ppl: Item[] = r.people || []; return <Pressable accessibilityRole="button" accessibilityLabel={`Join ${r.title}`} key={r.id} style={({ pressed }) => [s.roomCard, pressed && { transform: [{ scale: .985 }] }]} onPress={() => enterRoom(r)}>
      <LinearGradient colors={covers[i % covers.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.roomCover}>
        <View style={s.coverRing} />
        <View style={[s.row, { justifyContent: 'space-between' }]}><View style={s.roomBadge}><View style={[s.liveDot, { backgroundColor: '#7CFFB2' }]} /><Text style={s.roomBadgeText}>LIVE · {r.members?.length || 0} listening</Text></View>{r.locked && <Ionicons name="lock-closed" size={18} color="white" />}</View>
        <Text style={s.coverArt}>{roomArt[r.category] || '🎉'}</Text>
        <Text style={s.coverTitle}>{r.title}</Text>
      </LinearGradient>
      <View style={s.roomInfo}>
        <Text style={s.roomDescription}>{r.description || 'Come say hi!'}</Text>
        <View style={[s.row, { justifyContent: 'space-between', marginTop: 14 }]}>
          <View style={s.row}><View style={{ flexDirection: 'row' }}>{seated.slice(0, 4).map((x: Item, k: number) => { const p = ppl.find(pp => pp.id === x.userId); return <View key={x.index} style={{ marginLeft: k ? -12 : 0, borderWidth: 2, borderColor: 'white', borderRadius: 30 }}><Avatar name={p?.name} emoji={p?.avatar} size={34} /></View>; })}</View><Text style={s.small}>{seated.length} on mic</Text></View>
          <View style={s.joinPill}><Text style={s.joinText}>Join</Text><Ionicons name="arrow-forward" size={16} color="white" /></View>
        </View>
      </View>
    </Pressable>; })}
    {!loading && !filteredRooms.length && <Empty icon="headset-outline" title={error ? 'Rooms load nahi hue' : 'Koi room nahi mila'} note={error ? 'Upar Refresh dabao. Server jaagne mein thoda time lag sakta hai.' : 'Kuch aur search karo, ya apna room shuru karo!'} />}
    <Pressable style={s.createStrip} onPress={() => { setTitle(''); setDescription(''); navigate('create-room'); }}><LinearGradient colors={sunset} style={s.createIcon}><Ionicons name="add" size={26} color="white" /></LinearGradient><View style={{ flex: 1 }}><Text style={s.cardTitle}>Apna room banao</Text><Text style={s.small}>Invite friends, play music, chat all night.</Text></View><Ionicons name="chevron-forward" color={c.pink} size={22} /></Pressable>
  </>;

  const feedScreen = <>
    <Heading title="Discover" note="What everyone is up to" action={refresh} />
    <View style={s.compose}><Avatar name={user?.name} emoji={user?.avatar} size={44} /><TextInput accessibilityLabel="Write a post" value={text} onChangeText={setText} placeholder="Kya chal raha hai?" placeholderTextColor={c.faint} multiline style={[s.searchInput, { minWidth: 0 }]} /><Pressable accessibilityLabel="Post" disabled={busy || !text.trim()} onPress={() => act(async () => { await api('/posts', 'POST', { text }); setText(''); await refresh(); setNotice('Post share ho gaya!'); })}><LinearGradient colors={brand} style={s.sendBtn}><Ionicons name="send" size={18} color="white" /></LinearGradient></Pressable></View>
    {posts.map(p => { const liked = p.likes?.includes(user?.id); return <View key={p.id} style={s.card}>
      <Pressable style={s.row} onPress={() => openProfile(p.author.id)}><Avatar name={p.author?.name} emoji={p.author?.avatar} size={48} /><View style={{ flex: 1 }}><View style={s.row}><Text style={s.cardTitle}>{p.author?.name}</Text>{p.author?.vip && <Text style={s.vipBadge}>VIP</Text>}</View><Text style={s.tiny}>{ago(p.createdAt)}</Text></View></Pressable>
      <Text style={[s.body, { marginVertical: 14 }]}>{p.text}</Text>
      <View style={s.postActions}>
        <Pressable style={[s.row, s.actionPill, liked && { backgroundColor: '#FFE3EE' }]} onPress={() => act(async () => { await api(`/posts/${p.id}/like`, liked ? 'DELETE' : 'POST', {}); await refresh(); })}><Ionicons name={liked ? 'heart' : 'heart-outline'} size={21} color={c.pink} /><Text style={s.actionText}>{p.likes?.length || 0}</Text></Pressable>
        <Pressable style={[s.row, s.actionPill]} onPress={() => act(async () => { setComments(await api(`/posts/${p.id}/comments`)); setPost(p); navigate('comments'); })}><Ionicons name="chatbubble-ellipses-outline" size={20} color={c.violet} /><Text style={s.actionText}>{p.commentCount || 0} {p.commentCount === 1 ? 'comment' : 'comments'}</Text></Pressable>
      </View>
    </View>; })}
    {!posts.length && <Empty icon="sparkles-outline" title="Abhi tak koi post nahi" note="Pehla post aap karo!" />}
  </>;

  const messagesScreen = <>
    <Heading title="Messages" note="Your chats" action={refresh} />
    {conversations.map(cv => <Pressable key={cv.user.id} style={[s.card, s.row, { paddingVertical: 14 }]} onPress={() => openDm(cv.user)}><Avatar name={cv.user.name} emoji={cv.user.avatar} size={54} /><View style={{ flex: 1, gap: 3 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.cardTitle, { flex: 1 }]}>{cv.user.name}</Text><Text style={s.tiny}>{ago(cv.lastMessage?.createdAt)}</Text></View><Text style={s.small}>{cv.lastMessage?.fromId === user?.id ? 'You: ' : ''}{cv.lastMessage?.text || 'Say hello 👋'}</Text></View></Pressable>)}
    {!conversations.length && <Empty icon="chatbubbles-outline" title="Inbox khali hai" note="Discover mein kisi ki profile kholo aur message bhejo." />}
  </>;

  const profileScreen = <>
    <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.profileHead}>
      <View style={s.heroBlobA} />
      <Avatar name={user?.name} emoji={user?.avatar} size={92} ring />
      <Text style={s.profileName}>{user?.name}</Text>
      <Text style={s.profileBio}>{user?.bio || 'Add a bio so people know you.'}</Text>
      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statNum}>{user?.followers?.length ?? 0}</Text><Text style={s.statLabel}>Followers</Text></View>
        <View style={s.statLine} />
        <View style={s.stat}><Text style={s.statNum}>{user?.following?.length ?? 0}</Text><Text style={s.statLabel}>Following</Text></View>
        <View style={s.statLine} />
        <View style={s.stat}><Text style={s.statNum}>{user?.diamonds ?? 0}</Text><Text style={s.statLabel}>Diamonds</Text></View>
      </View>
    </LinearGradient>
    <Pressable onPress={openWallet}><LinearGradient colors={sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.walletBanner}><View style={{ flex: 1 }}><Text style={s.walletLabel}>My wallet</Text><Text style={s.walletCoins}>🪙 {user?.coins || 0}</Text><Text style={s.walletLabel}>💎 {user?.diamonds || 0} diamonds</Text></View><View style={s.walletBtn}><Text style={[s.buttonText, { color: c.pink }]}>Open</Text><Ionicons name="chevron-forward" size={18} color={c.pink} /></View></LinearGradient></Pressable>
    <View style={s.menuCard}>{[
      { title: 'Edit profile', icon: 'create', color: c.violet, bg: '#EDE3FF', fn: () => { setName(user?.name || ''); setDescription(user?.bio || ''); navigate('edit-profile'); } },
      { title: 'VIP membership', icon: 'diamond', color: c.mango, bg: '#FFF0D9', fn: () => loadCatalog('vip') },
      { title: 'Gift store', icon: 'gift', color: c.pink, bg: '#FFE3EE', fn: () => loadCatalog('gifts') },
      { title: 'My family', icon: 'people', color: c.teal, bg: '#DDF7F1', fn: () => loadCatalog('families') },
      { title: 'Daily rewards', icon: 'star', color: c.yellow, bg: '#FFF6D6', fn: () => loadCatalog('tasks') },
      { title: 'Style shop', icon: 'color-palette', color: c.blue, bg: '#E2ECFF', fn: () => loadCatalog('decorations') },
      { title: 'Settings & privacy', icon: 'settings', color: c.muted, bg: '#EFEDF5', fn: () => navigate('settings') },
    ].map((x, k, all) => <Pressable key={x.title} style={[s.menuRow, k === all.length - 1 && { borderBottomWidth: 0 }]} onPress={x.fn}><Tile icon={x.icon as Icon} color={x.color} bg={x.bg} /><Text style={[s.menuText, { flex: 1 }]}>{x.title}</Text><Ionicons name="chevron-forward" size={20} color={c.faint} /></Pressable>)}</View>
  </>;

  const chatView = <><View style={s.messagesArea}>{messages.filter(m => page === 'dm' ? (m.fromId === dm?.id && m.toId === user?.id) || (m.fromId === user?.id && m.toId === dm?.id) : m.roomId === room?.id).map(m => { const mine = m.fromId === user?.id; const who = mine ? 'You' : m.author?.name || (page === 'dm' ? dm?.name : nameOf(m.fromId)); return <View key={m.id} style={[s.row, { alignItems: 'flex-end', alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%' }]}>{!mine && <Avatar name={who} emoji={m.author?.avatar || (page === 'dm' ? dm?.avatar : emojiOf(m.fromId))} size={32} />}{mine ? <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.chatBubble, s.ownBubble]}><Text style={[s.body, { color: 'white' }]}>{m.text}</Text><Text style={[s.chatTime, { color: '#FFFFFFB0' }]}>{ago(m.createdAt)}</Text></LinearGradient> : <View style={s.chatBubble}>{page !== 'dm' && <Text style={s.chatAuthor}>{who}</Text>}<Text style={s.body}>{m.text}</Text><Text style={s.chatTime}>{ago(m.createdAt)}</Text></View>}</View>; })}{!messages.length && <Text style={[s.small, { textAlign: 'center', paddingVertical: 20 }]}>Abhi koi message nahi. Pehla "Hi" aap bolo 👋</Text>}</View>
    <View style={s.composer}><TextInput accessibilityLabel="Message" placeholder="Type a message…" placeholderTextColor={c.faint} value={text} onChangeText={setText} style={s.searchInput} onSubmitEditing={sendMessage} /><Pressable accessibilityLabel="Send message" disabled={!text.trim() || busy} onPress={sendMessage}><LinearGradient colors={brand} style={[s.sendBtn, !text.trim() && { opacity: .5 }]}><Ionicons name="send" size={18} color="white" /></LinearGradient></Pressable></View></>;

  let detail: React.ReactNode = null;
  if (page === 'join-locked') detail = <View style={s.form}><Text style={s.sectionTitle}>🔒 {pendingRoom?.title}</Text><Text style={s.bodyMuted}>Ye private room hai. Password host se pucho.</Text><Field label="Room password" value={password} onChangeText={setPassword} secure /><Button title="Enter room" icon="enter" disabled={busy || !password} onPress={() => enterRoom(pendingRoom!, password)} /></View>;
  if (page === 'room-settings' && room) detail = <View style={s.form}><Field label="Room name" value={title} onChangeText={setTitle} /><Field label="Description" value={description} onChangeText={setDescription} multiline /><Field label="New room password (optional)" value={password} onChangeText={setPassword} secure /><Text style={s.small}>Password kam se kam 4 characters ka rakho, phir room lock karo to private ho jayega.</Text><Button title="Save changes" icon="checkmark" disabled={busy || !title.trim()} onPress={() => act(async () => { await api(`/rooms/${room.id}`, 'PATCH', { title, description, ...(password ? { password } : {}) }); setRoom(await api(`/rooms/${room.id}`)); navigate('room'); setPassword(''); setNotice('Room update ho gaya.'); })} /></View>;
  if (page === 'games') detail = <><Text style={s.bodyMuted}>Room mein kisi ke saath khelo. Sirf masti — koi betting nahi.</Text><View style={[s.row, { gap: 12, marginVertical: 16 }]}><Pressable style={{ flex: 1 }} disabled={!room || busy} onPress={() => act(async () => { setGame(await api('/games', 'POST', { roomId: room?.id })); navigate('game'); })}><LinearGradient colors={covers[1]} style={s.gameTile}><Text style={{ fontSize: 40 }}>❌⭕</Text><Text style={s.gameTileText}>Tic-tac-toe</Text></LinearGradient></Pressable><Pressable style={{ flex: 1 }} disabled={!room || busy} onPress={() => act(async () => { setGame(await api('/games/connect-four', 'POST', { roomId: room?.id })); navigate('game'); })}><LinearGradient colors={covers[2]} style={s.gameTile}><Text style={{ fontSize: 40 }}>🔴🟡</Text><Text style={s.gameTileText}>Connect Four</Text></LinearGradient></Pressable></View>{catalog.games?.filter(g => g.roomId === room?.id).length ? <Heading title="Games in this room" /> : null}{catalog.games?.filter(g => g.roomId === room?.id).map(g => <View style={[s.card, s.row]} key={g.id}><Text style={{ fontSize: 30 }}>{g.type === 'connect-four' ? '🔴' : '❌'}</Text><View style={{ flex: 1 }}><Text style={s.cardTitle}>{g.type === 'connect-four' ? 'Connect Four' : 'Tic-tac-toe'}</Text><Text style={s.small}>{g.players?.map((p: Item) => p.name).join(' vs ')} · {g.status}</Text></View><Button small title={g.playerIds?.includes(user?.id) || g.status !== 'waiting' ? 'Open' : 'Join'} onPress={() => act(async () => { setGame(g.playerIds?.includes(user?.id) || g.status !== 'waiting' ? g : await api(`/games/${g.id}/join`, 'POST', {})); navigate('game'); })} /></View>)}</>;
  if (page === 'game' && game) detail = <View style={s.form}><Text style={s.sectionTitle}>{game.players?.map((p: Item) => p.name).join('  vs  ')}</Text><View style={s.statusPill}><Text style={s.statusText}>{game.status === 'waiting' ? '⏳ Dusre player ka wait ho raha hai' : game.status === 'finished' ? game.winnerId === user?.id ? '🏆 Aap jeet gaye!' : 'Game over. Achha khela!' : game.status === 'draw' ? '🤝 Draw!' : game.turn === user?.id ? '👉 Aapki baari' : '⏳ Dusre player ki baari'}</Text></View>{game.type === 'connect-four' ? <View style={s.c4Board}>{game.board?.map((mark: string | null, index: number) => <Pressable key={index} accessibilityLabel={`Column ${(index % 7) + 1}, ${mark ? (mark === 'R' ? 'red' : 'yellow') : 'empty'}`} disabled={busy || game.status !== 'playing' || game.turn !== user?.id} style={{ width: '12.4%', aspectRatio: 1, borderRadius: 99, backgroundColor: mark === 'R' ? c.red : mark === 'Y' ? c.yellow : '#FFFFFF' }} onPress={() => act(async () => { setGame(await api(`/games/${game.id}/drop`, 'POST', { column: index % 7 })); })} />)}</View> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingVertical: 20 }}>{game.board?.map((mark: string | null, index: number) => <Pressable key={index} accessibilityLabel={`Square ${index + 1}: ${mark || 'empty'}`} disabled={busy || !!mark || game.status !== 'playing' || game.turn !== user?.id} style={{ width: '29%', aspectRatio: 1, borderRadius: 20, backgroundColor: 'white', borderWidth: 2, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }} onPress={() => act(async () => { setGame(await api(`/games/${game.id}/move`, 'POST', { index })); })}><Text style={{ color: mark === 'X' ? c.pink : c.violet, fontSize: 48, fontWeight: '900' }}>{mark || ''}</Text></Pressable>)}</View>}<Button title="Refresh board" icon="refresh" soft onPress={() => act(async () => { const games = await api('/games'); setGame(games.find((g: Item) => g.id === game.id)); })} /></View>;
  if (page === 'pk') detail = <View style={s.form}><LinearGradient colors={['#FF3D7F', '#3D7BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.pkHero}><Text style={{ fontSize: 44 }}>⚡</Text><Text style={s.pkTitle}>PK Battle</Text><Text style={s.pkSub}>3 minute ka gift-score muqabla. Test coins only.</Text></LinearGradient>{battle ? <View style={s.card}><Text style={s.sectionTitle}>{battle.status === 'active' ? '🔥 Battle chal raha hai' : '🏁 Battle khatam'}</Text><Text style={s.small}>Ends at {new Date(battle.endsAt).toLocaleTimeString()}</Text>{battle.scores?.map((p: Item) => <View key={p.user.id} style={s.menuRow}><Avatar name={p.user.name} emoji={p.user.avatar} /><Text style={[s.menuText, { flex: 1 }]}>{p.user.name}</Text><Text style={s.score}>💎 {p.score}</Text></View>)}</View> : <Empty icon="flash-outline" title="Koi battle nahi chal raha" note="Host kisi member ko 3 minute ke battle ke liye challenge kar sakta hai." />}{room?.ownerId === user?.id && battle?.status !== 'active' && <><Text style={s.label}>Kisko challenge karna hai?</Text>{room?.members?.filter((id: string) => id !== user?.id).map((id: string) => <Pressable key={id} style={[s.card, s.row]} onPress={() => act(async () => { await api(`/rooms/${room!.id}/pk`, 'POST', { opponentId: id, durationSeconds: 180 }); setBattle(await api(`/rooms/${room!.id}/pk`)); })}><Avatar name={nameOf(id)} emoji={emojiOf(id)} /><Text style={[s.menuText, { flex: 1 }]}>{nameOf(id)}</Text><Text style={s.link}>Challenge ⚡</Text></Pressable>)}</>}<Button title="Refresh scores" icon="refresh" soft onPress={() => act(async () => setBattle(await api(`/rooms/${room!.id}/pk`)))} /></View>;
  if (page === 'create-room') detail = <View style={s.form}><Text style={s.bodyMuted}>Room ka naam aur vibe choose karo, friends ko bulao.</Text><Field label="Room name" value={title} onChangeText={setTitle} placeholder="e.g. Sunday Night Adda" /><Field label="What's it about?" value={description} onChangeText={setDescription} multiline placeholder="Music, chit-chat, gaming…" /><Text style={s.label}>Choose a vibe</Text><View style={s.wrap}>{['Chat', 'Chill', 'Music', 'Gaming', 'Friends'].map(cat => <Pressable key={cat} onPress={() => setFormCategory(cat)}>{formCategory === cat ? <LinearGradient colors={sunset} style={s.chip}><Text style={[s.chipText, { color: 'white' }]}>{roomArt[cat]} {cat}</Text></LinearGradient> : <View style={[s.chip, s.chipIdle]}><Text style={s.chipText}>{roomArt[cat]} {cat}</Text></View>}</Pressable>)}</View><Button title="Create room" icon="rocket" disabled={busy || !title.trim()} onPress={() => act(async () => { const r = await api('/rooms', 'POST', { title, description, category: formCategory }); await api(`/rooms/${r.id}/join`, 'POST', {}); setRoom(await api(`/rooms/${r.id}`)); setMessages(await api(`/rooms/${r.id}/messages`)); navigate('room'); await refresh(); })} /></View>;
  if (page === 'room' && room) detail = <>
    <LinearGradient colors={['#2A0E5C', '#7B2FF7', '#FF3D7F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.roomStage}>
      <View style={s.heroBlobB} />
      <View style={[s.row, { justifyContent: 'space-between' }]}><View style={s.liveTag}><View style={s.liveDot} /><Text style={s.liveText}>LIVE · {room.members?.length || 0} in room</Text></View><Text style={s.stageCat}>{roomArt[room.category] || '🎉'} {room.category}</Text></View>
      <Text style={s.stageTitle}>{room.title}</Text>
      {!!room.description && <Text style={s.stageDesc}>{room.description}</Text>}
      <View style={s.seats}>{room.seats?.map((seat: Item) => <View key={seat.index} style={s.seatCell}>
        <Pressable accessibilityLabel={`Seat ${seat.index + 1}${seat.locked ? ' locked' : ''}`} onPress={() => { if (seat.userId && seat.userId !== user?.id) openProfile(seat.userId); else seatAction(seat.index, seat.userId === user?.id ? 'leave' : 'take'); }}>
          {seat.userId ? <View><Avatar name={nameOf(seat.userId)} emoji={emojiOf(seat.userId)} size={58} ring />{seat.muted && <View style={s.muteBadge}><Ionicons name="mic-off" size={12} color="white" /></View>}</View> : <View style={s.seatEmpty}><Ionicons name={seat.locked ? 'lock-closed' : 'add'} color="#FFFFFFCC" size={24} /></View>}
        </Pressable>
        <Text style={s.seatName}>{seat.userId ? firstName(nameOf(seat.userId)) : seat.locked ? 'Locked' : `Seat ${seat.index + 1}`}</Text>
        {room.ownerId === user?.id && <View style={s.row}><Pressable accessibilityLabel={`Toggle lock seat ${seat.index + 1}`} onPress={() => seatAction(seat.index, seat.locked ? 'unlock' : 'lock')}><Ionicons name={seat.locked ? 'lock-open-outline' : 'lock-closed-outline'} size={17} color="#FFFFFFCC" /></Pressable>{seat.userId && <Pressable accessibilityLabel={`Toggle mute seat ${seat.index + 1}`} onPress={() => seatAction(seat.index, seat.muted ? 'unmute' : 'mute')}><Ionicons name={seat.muted ? 'mic-outline' : 'mic-off-outline'} size={17} color="#FFFFFFCC" /></Pressable>}</View>}
      </View>)}</View>
      <View style={s.stageControls}>
        <Pressable style={[s.roundBtn, audioConnected && { backgroundColor: c.teal }]} onPress={joinAudio}><Ionicons name={audioConnected ? 'volume-high' : 'headset'} size={24} color="white" /><Text style={s.roundLabel}>{audioConnected ? 'Leave audio' : 'Listen'}</Text></Pressable>
        <Pressable style={[s.roundBtn, micOn && { backgroundColor: c.pink }, (!audioConnected || !currentSeat || currentSeat.muted) && { opacity: .5 }]} disabled={!audioConnected || !currentSeat || currentSeat.muted} onPress={toggleMic}><Ionicons name={micOn ? 'mic' : 'mic-off'} size={24} color="white" /><Text style={s.roundLabel}>{micOn ? 'Mic on' : 'Mic off'}</Text></Pressable>
        <Pressable style={[s.roundBtn, { backgroundColor: c.mango }]} onPress={() => loadCatalog('gifts')}><Ionicons name="gift" size={24} color="white" /><Text style={s.roundLabel}>Gift</Text></Pressable>
      </View>
    </LinearGradient>
    <View style={s.roomTools}>{([
      { t: 'Games', i: 'game-controller', col: c.violet, bg: '#EDE3FF', fn: () => loadCatalog('games') },
      { t: 'Mic queue', i: 'hand-left', col: c.teal, bg: '#DDF7F1', fn: () => act(async () => { setQueue(await api(`/rooms/${room.id}/queue`)); navigate('queue'); }) },
      { t: 'Lucky bag', i: 'cash', col: c.red, bg: '#FFE3E3', fn: () => act(async () => { setBags(await api(`/rooms/${room.id}/lucky-bags`)); navigate('lucky'); }) },
      { t: 'PK battle', i: 'flash', col: c.mango, bg: '#FFF0D9', fn: () => act(async () => { setBattle(await api(`/rooms/${room.id}/pk`)); navigate('pk'); }) },
    ] as const).map(x => <Pressable key={x.t} style={s.toolItem} onPress={x.fn}><Tile icon={x.i} color={x.col} bg={x.bg} /><Text style={s.toolLabel}>{x.t}</Text></Pressable>)}</View>
    {room.ownerId === user?.id && <Button title={room.locked ? 'Unlock room' : 'Lock room'} icon={room.locked ? 'lock-open' : 'lock-closed'} soft onPress={() => act(async () => { await api(`/rooms/${room.id}`, 'PATCH', { locked: !room.locked }); setRoom(await api(`/rooms/${room.id}`)); })} />}
    <View style={s.serviceNote}><Ionicons name="information-circle" size={20} color={c.violet} /><Text style={[s.small, { flex: 1 }]}>Text chat abhi chalu hai. Live voice ke liye server par audio service lagani hogi.</Text></View>
    <Heading title="Room chat" note="Be nice, have fun 🙂" />
    {chatView}
    {room.ownerId === user?.id && <View style={s.card}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.cardTitle}>Host controls</Text><Button small soft title="Settings" icon="settings" onPress={() => { setTitle(room.title); setDescription(room.description || ''); setPassword(''); navigate('room-settings'); }} /></View>{room.members?.filter((id: string) => id !== user?.id).map((id: string) => <View key={id} style={[s.row, { marginTop: 14 }]}><Pressable style={[s.row, { flex: 1 }]} onPress={() => openProfile(id)}><Avatar name={nameOf(id)} emoji={emojiOf(id)} size={38} /><Text style={s.menuText}>{nameOf(id)}</Text></Pressable><Button small title="Remove" soft onPress={() => act(async () => { await api(`/rooms/${room.id}/kick`, 'POST', { userId: id }); setRoom(await api(`/rooms/${room.id}`)); })} /></View>)}</View>}
  </>;
  if (page === 'dm') detail = <>{dm && <Pressable style={[s.card, s.row]} onPress={() => openProfile(dm.id)}><Avatar name={dm.name} emoji={dm.avatar} size={50} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>{dm.name}</Text><Text style={s.small}>{dm.bio || 'Tap to view profile'}</Text></View></Pressable>}{chatView}</>;
  if (page === 'wallet') detail = <><LinearGradient colors={sunset} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.walletHero}><Text style={s.walletLabel}>Total balance</Text><Text style={[s.walletCoins, { fontSize: 42 }]}>🪙 {wallet?.coins || 0}</Text><Text style={s.walletLabel}>💎 {wallet?.diamonds || 0} diamonds received</Text></LinearGradient><Text style={[s.small, { marginVertical: 14 }]}>Ye test coins hain — inki koi asli keemat nahi hai. Real payment abhi band hai.</Text><Button title="Add 100 test coins" icon="add-circle" disabled={busy} onPress={() => act(async () => { await api('/wallet/demo-credit', 'POST', { amount: 100 }); setWallet(await api('/wallet')); await refresh(); setNotice('100 coins add ho gaye!'); })} /><View style={{ height: 20 }} /><Heading title="History" />{wallet?.ledger?.map((l: Item) => { const plus = l.type === 'demo-credit' || l.recipientId === user?.id || l.type === 'reward'; return <View key={l.id} style={s.menuRow}><Tile icon={plus ? 'arrow-down' : 'arrow-up'} color={plus ? c.teal : c.pink} bg={plus ? '#DDF7F1' : '#FFE3EE'} /><View style={{ flex: 1 }}><Text style={s.menuText}>{l.type === 'demo-credit' ? 'Coins added' : l.type === 'gift' ? 'Gift' : l.type || l.kind || 'Transaction'}</Text><Text style={s.tiny}>{l.createdAt ? ago(l.createdAt) : ''}</Text></View><Text style={[s.score, { color: plus ? c.teal : c.pink }]}>{plus ? '+' : '−'}{l.amount ?? l.coins ?? l.cost ?? ''}</Text></View>; })}{!wallet?.ledger?.length && <Empty icon="wallet-outline" title="Koi transaction nahi" note="Aapki coin history yahan dikhegi." />}</>;
  if (page === 'gifts') detail = <><Text style={s.bodyMuted}>Kisi ka din bana do — ek gift bhejo 🎁</Text><View style={s.giftGrid}>{catalog.gifts?.map((g, i) => <Pressable key={g.id} style={[s.gift, selectedGift?.id === g.id && { borderColor: c.pink, backgroundColor: '#FFF0F5' }]} onPress={() => setSelectedGift(g)}><View style={[s.giftIcon, { backgroundColor: tints[i % tints.length] }]}><Text style={{ fontSize: 38 }}>{g.emoji}</Text></View><Text style={s.cardTitle}>{g.name}</Text><Text style={s.price}>🪙 {g.cost}</Text></Pressable>)}</View>{selectedGift && <View style={s.form}><Text style={s.sectionTitle}>{selectedGift.emoji} {selectedGift.name} kisko bhejna hai?</Text>{room ? <><View style={s.wrap}>{room.members?.filter((id: string) => id !== user?.id).map((id: string) => <Pressable key={id} onPress={() => setRecipient(id)} style={[s.personChip, recipient === id && { borderColor: c.pink, backgroundColor: '#FFF0F5' }]}><Avatar name={nameOf(id)} emoji={emojiOf(id)} size={32} /><Text style={s.menuText}>{firstName(nameOf(id))}</Text></Pressable>)}</View>{room.members?.length < 2 && <Text style={s.small}>Room mein abhi koi aur nahi hai. Kisi ko invite karo.</Text>}</> : <Field label="Recipient user ID" value={recipient} onChangeText={setRecipient} placeholder="Profile kholkar 'Send a gift' dabao" />}<Button title={`Send gift · 🪙 ${selectedGift.cost}`} icon="send" disabled={busy || !recipient} onPress={() => act(async () => { await api('/gifts/send', 'POST', { giftId: selectedGift.id, recipientId: recipient, quantity: 1, roomId: room?.members?.includes(recipient) ? room.id : undefined, idempotencyKey: giftRequestKey(selectedGift.id, recipient, room?.id) }); await refresh(); giftKeyRef.current = null; setSelectedGift(null); setNotice('Gift bhej diya! ✨'); })} /></View>}</>;
  if (page === 'families') detail = <><Text style={s.bodyMuted}>Apni gang dhoondo — ya khud banao.</Text>{catalog.families?.map((f, i) => { const inIt = f.members?.includes(user?.id); return <View key={f.id} style={s.card}><View style={s.row}><LinearGradient colors={covers[i % covers.length]} style={s.familyBadge}><Text style={{ fontSize: 26 }}>{['🔥', '🌙', '🎮', '🎤', '💫'][i % 5]}</Text></LinearGradient><View style={{ flex: 1 }}><Text style={s.cardTitle}>{f.name}</Text><Text style={s.small}>{f.members?.length || 0} members</Text></View></View><Text style={[s.body, { marginVertical: 12 }]}>{f.description}</Text><Button title={inIt ? 'Leave family' : 'Join family'} icon={inIt ? 'exit-outline' : 'people'} soft={inIt} onPress={() => act(async () => { await api(`/families/${f.id}/join`, inIt ? 'DELETE' : 'POST', {}); const data = await api('/families'); setCatalog(prev => ({ ...prev, families: data })); })} /></View>; })}<View style={[s.card, { gap: 14 }]}><Text style={s.sectionTitle}>Nayi family banao</Text><Field label="Family name" value={title} onChangeText={setTitle} /><Field label="Description" value={description} onChangeText={setDescription} /><Button title="Create family" icon="add" disabled={!title.trim() || busy} onPress={() => act(async () => { await api('/families', 'POST', { name: title, description }); const data = await api('/families'); setCatalog(prev => ({ ...prev, families: data })); setTitle(''); setNotice('Family ban gayi!'); })} /></View></>;
  if (page === 'events') detail = <>{catalog.events?.map((e, i) => { const joined = (e.attendees || e.rsvps || []).includes(user?.id); return <View key={e.id} style={s.card}><LinearGradient colors={covers[(i + 2) % covers.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.eventArt}><Text style={{ fontSize: 48 }}>{['🎤', '🔥', '📝', '🏏', '🎉'][i % 5]}</Text><Text style={s.eventTag}>{when(e.startsAt || e.startAt)}</Text></LinearGradient><Text style={[s.sectionTitle, { marginTop: 14 }]}>{e.title}</Text><Text style={[s.body, { marginVertical: 10 }]}>{e.description}</Text><Text style={[s.small, { marginBottom: 12 }]}>👥 {(e.attendees || e.rsvps || []).length} going</Text><Button title={joined ? "You're going ✓  (tap to cancel)" : "I'm in!"} soft={joined} onPress={() => act(async () => { await api(`/events/${e.id}/rsvp`, joined ? 'DELETE' : 'POST', {}); const data = await api('/events'); setCatalog(prev => ({ ...prev, events: data })); setNotice(joined ? 'RSVP cancel ho gaya.' : 'Done! Aapka naam list mein hai 🎉'); })} /></View>; })}{!catalog.events?.length && <Empty icon="calendar-outline" title="Abhi koi event nahi" note="Naye events jald aayenge." />}</>;
  if (page === 'tasks') detail = <><LinearGradient colors={['#00B89C', '#3D7BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.pkHero}><Text style={{ fontSize: 44 }}>🎁</Text><Text style={s.pkTitle}>Daily rewards</Text><Text style={s.pkSub}>Roz ke chhote kaam karo, coins kamao.</Text></LinearGradient><View style={{ height: 10 }} />{catalog.tasks?.map(t => <View key={t.id} style={[s.card, s.row]}><Tile icon={t.claimed ? 'checkmark-circle' : 'star'} color={t.claimed ? c.teal : c.mango} bg={t.claimed ? '#DDF7F1' : '#FFF0D9'} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>{t.title}</Text><Text style={s.small}>🪙 {t.reward} coins</Text></View><Button small soft={!t.ready || t.claimed} title={t.claimed ? 'Done ✓' : t.ready ? 'Claim' : 'Pending'} disabled={busy || t.claimed || !t.ready} onPress={() => act(async () => { await api(`/tasks/${t.id}/claim`, 'POST', {}); const data = await api('/tasks'); setCatalog(prev => ({ ...prev, tasks: data })); await refresh(); setNotice('Reward mil gaya! 🪙'); })} /></View>)}</>;
  if (page === 'leaderboard') { const list = catalog.leaderboard || []; const top = list.slice(0, 3); const order = [top[1], top[0], top[2]]; detail = <><LinearGradient colors={['#FFC93C', '#FF9F1C', '#FF3D7F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.podium}><Text style={s.podiumTitle}>🏆 This week's stars</Text><View style={s.podiumRow}>{order.map((r, k) => r ? <Pressable key={r.user.id} style={[s.podiumItem, k === 1 && { marginTop: -18 }]} onPress={() => openProfile(r.user.id)}><Text style={{ fontSize: 26 }}>{['🥈', '🥇', '🥉'][k]}</Text><Avatar name={r.user.name} emoji={r.user.avatar} size={k === 1 ? 74 : 60} /><Text style={s.podiumName}>{firstName(r.user.name)}</Text><Text style={s.podiumScore}>💎 {r.diamonds}</Text></Pressable> : <View key={k} style={s.podiumItem} />)}</View></LinearGradient>{list.slice(3).map((r, i) => <Pressable key={r.user.id} style={s.menuRow} onPress={() => openProfile(r.user.id)}><Text style={s.rankNum}>{r.rank || i + 4}</Text><Avatar name={r.user.name} emoji={r.user.avatar} /><Text style={[s.menuText, { flex: 1 }]}>{r.user.name}</Text><Text style={s.score}>💎 {r.diamonds}</Text></Pressable>)}</>; }
  if (page === 'vip' || page === 'store') detail = <><LinearGradient colors={['#2A0E5C', '#7B2FF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.vipHero}><Text style={{ fontSize: 52 }}>👑</Text><Text style={s.pkTitle}>Party VIP</Text><Text style={s.pkSub}>Special badge, entry effects aur bahut kuch.</Text></LinearGradient>{catalog[page]?.map((v, i) => <View key={v.id || i} style={[s.card, s.row, { alignItems: 'flex-start' }]}><Tile icon="diamond" color={c.mango} bg="#FFF0D9" /><View style={{ flex: 1 }}><Text style={s.cardTitle}>{v.name || v.title}</Text><Text style={[s.body, { marginTop: 6 }]}>{v.description || (v.benefits || []).join(' · ')}</Text></View></View>)}<View style={s.serviceNote}><Ionicons name="information-circle" size={20} color={c.violet} /><Text style={[s.small, { flex: 1 }]}>VIP kharidna abhi band hai. Payment system lagne ke baad chalu hoga.</Text></View></>;
  if (page === 'edit-profile') detail = <View style={s.form}><View style={{ alignItems: 'center' }}><Avatar name={name || user?.name} emoji={user?.avatar} size={90} ring /></View><Field label="Your name" value={name} onChangeText={setName} /><Field label="Bio" value={description} onChangeText={setDescription} multiline placeholder="Apne baare mein kuch likho…" /><Button title="Save profile" icon="checkmark" disabled={busy || !name.trim()} onPress={() => act(async () => { await api('/me', 'PATCH', { name, bio: description }); await refresh(); navigate(''); setNotice('Profile save ho gayi!'); })} /></View>;
  if (page === 'user' && profile) { const following = user?.following?.includes(profile.id); detail = <><LinearGradient colors={covers[hash(profile.name) % covers.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.profileHead}><Avatar name={profile.name} emoji={profile.avatar} size={92} ring /><View style={s.row}><Text style={s.profileName}>{profile.name}</Text>{profile.vip && <Text style={[s.vipBadge, { backgroundColor: '#FFFFFF33', color: 'white' }]}>VIP</Text>}</View><Text style={s.profileBio}>{profile.bio || 'Hey there! 👋'}</Text><View style={s.statsRow}><View style={s.stat}><Text style={s.statNum}>{profile.followers?.length ?? 0}</Text><Text style={s.statLabel}>Followers</Text></View><View style={s.statLine} /><View style={s.stat}><Text style={s.statNum}>{profile.following?.length ?? 0}</Text><Text style={s.statLabel}>Following</Text></View></View></LinearGradient><View style={[s.row, { gap: 10, marginBottom: 14 }]}><View style={{ flex: 1 }}><Button title="Message" icon="chatbubble" onPress={() => openDm(profile)} /></View><View style={{ flex: 1 }}><Button title={following ? 'Following ✓' : 'Follow'} icon={following ? undefined : 'person-add'} soft onPress={() => act(async () => { await api(`/users/${profile.id}/follow`, following ? 'DELETE' : 'POST', {}); await refresh(); setNotice(following ? 'Unfollow kar diya.' : `Ab aap ${firstName(profile.name)} ko follow kar rahe ho!`); })} /></View></View><Button title="Send a gift" icon="gift" soft onPress={() => { setRecipient(profile.id); loadCatalog('gifts'); }} /><View style={[s.card, { gap: 14, marginTop: 18 }]}><Text style={s.cardTitle}>Safety</Text><Field label="Report reason" value={description} onChangeText={setDescription} multiline placeholder="Kya problem hui? Batao." /><Button title="Submit report" small soft disabled={busy || !description.trim()} onPress={() => act(async () => { await api('/reports', 'POST', { targetType: 'user', targetId: profile.id, reason: description }); setDescription(''); setNotice('Report mil gayi. Hum check karenge.'); })} /><Button title="Block this person" small soft onPress={() => act(async () => { await api(`/users/${profile.id}/block`, 'POST', {}); setNotice('Block kar diya.'); goHome(); })} /></View></>; }
  if (page === 'comments' && post) detail = <><View style={s.card}><View style={s.row}><Avatar name={post.author?.name} emoji={post.author?.avatar} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>{post.author?.name}</Text><Text style={s.tiny}>{ago(post.createdAt)}</Text></View></View><Text style={[s.body, { marginTop: 12 }]}>{post.text}</Text></View><Heading title={`${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`} />{comments.map(cm => <View key={cm.id} style={[s.row, { alignItems: 'flex-start', marginBottom: 14 }]}><Avatar name={cm.author?.name} emoji={cm.author?.avatar} size={38} /><View style={[s.chatBubble, { flex: 1, maxWidth: undefined }]}><Text style={s.chatAuthor}>{cm.author?.name || 'Member'}</Text><Text style={s.body}>{cm.text}</Text><Text style={s.chatTime}>{ago(cm.createdAt)}</Text></View></View>)}<View style={s.composer}><TextInput accessibilityLabel="Your comment" placeholder="Write a comment…" placeholderTextColor={c.faint} value={text} onChangeText={setText} style={s.searchInput} /><Pressable accessibilityLabel="Post comment" disabled={busy || !text.trim()} onPress={() => act(async () => { await api(`/posts/${post.id}/comments`, 'POST', { text }); setComments(await api(`/posts/${post.id}/comments`)); setText(''); await refresh(); })}><LinearGradient colors={brand} style={[s.sendBtn, !text.trim() && { opacity: .5 }]}><Ionicons name="send" size={18} color="white" /></LinearGradient></Pressable></View></>;
  if (page === 'queue' && room) detail = <View style={s.form}><Text style={s.bodyMuted}>Bolna hai? Queue mein aao — host aapko khali seat pe bula lega.</Text>{(() => { const inQueue = queue.some(x => x.id === user?.id); const seated = !!currentSeat; return <Button title={seated ? 'Aapke paas seat hai' : inQueue ? 'Leave queue' : 'Raise hand ✋'} disabled={busy || seated} onPress={() => act(async () => { setQueue(await api(`/rooms/${room.id}/queue`, 'POST', { action: inQueue ? 'leave' : 'join' })); })} />; })()}{queue.length === 0 && <Empty icon="hand-left-outline" title="Queue khali hai" note="Sabse pehle haath uthao!" />}{queue.map((qq, i) => <View key={qq.id} style={[s.card, s.row]}><Text style={s.rankNum}>{i + 1}</Text><Avatar name={qq.name} emoji={qq.avatar} size={40} /><Text style={[s.menuText, { flex: 1 }]}>{qq.name}</Text>{room.ownerId === user?.id && <Button small title="Invite" soft disabled={busy} onPress={() => act(async () => { await api(`/rooms/${room.id}/queue/promote`, 'POST', { userId: qq.id }); setQueue(await api(`/rooms/${room.id}/queue`)); setRoom(await api(`/rooms/${room.id}`)); })} />}</View>)}</View>;
  if (page === 'lucky' && room) detail = <View style={s.form}><LinearGradient colors={['#E5484D', '#FF9F1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.pkHero}><Text style={{ fontSize: 44 }}>🧧</Text><Text style={s.pkTitle}>Lucky bag</Text><Text style={s.pkSub}>Room mein sabke saath coins baanto. Jo bacha, 24 ghante baad wapas.</Text></LinearGradient><View style={[s.card, { gap: 14 }]}><Field label="Total coins (10–10000)" value={bagTotal} onChangeText={setBagTotal} /><Field label="Kitne logon mein (2–20)" value={bagCount} onChangeText={setBagCount} /><Button title="Send lucky bag" icon="send" disabled={busy} onPress={() => act(async () => { await api(`/rooms/${room.id}/lucky-bags`, 'POST', { total: Number(bagTotal), count: Number(bagCount) }); setBags(await api(`/rooms/${room.id}/lucky-bags`)); await refresh(); setNotice('Lucky bag bhej diya!'); })} /></View>{bags.map(b => <View key={b.id} style={[s.card, s.row]}><Text style={{ fontSize: 34 }}>🧧</Text><View style={{ flex: 1 }}><Text style={s.cardTitle}>{b.sender?.name} ka bag</Text><Text style={s.small}>🪙 {b.total} · {b.remaining} of {b.count} left</Text>{b.mine != null && <Text style={[s.small, { color: c.teal, fontWeight: '700' }]}>Aapko mile 🪙 {b.mine}</Text>}</View>{b.mine == null && b.sender?.id !== user?.id && b.remaining > 0 && <Button small title="Grab!" disabled={busy} onPress={() => act(async () => { const r = await api(`/lucky-bags/${b.id}/claim`, 'POST', {}); setNotice(`Aapko ${r.amount} coins mile! 🎉`); setBags(await api(`/rooms/${room.id}/lucky-bags`)); await refresh(); })} />}</View>)}</View>;
  if (page === 'decorations') detail = <><Text style={s.bodyMuted}>Frames, entry effects aur badges — profile ko chamkao ✨</Text>{catalog.decorations?.map((d, i) => <View key={d.id} style={[s.card, s.row]}><View style={[s.giftIcon, { backgroundColor: tints[i % tints.length], width: 60, height: 60 }]}><Text style={{ fontSize: 32 }}>{d.emoji}</Text></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>{d.name}</Text><Text style={s.small}>{d.slot} · 🪙 {d.price}</Text></View><Button small title={d.equipped ? 'Remove' : d.owned ? 'Use' : 'Buy'} soft={d.owned} disabled={busy} onPress={() => act(async () => { const data = d.equipped ? await api(`/decorations/slot/${d.slot}`, 'DELETE', {}) : d.owned ? await api(`/decorations/${d.id}/equip`, 'POST', {}) : await api(`/decorations/${d.id}/buy`, 'POST', {}); setCatalog(prev => ({ ...prev, decorations: data.items })); await refresh(); })} /></View>)}</>;
  if (page === 'settings') detail = <View style={s.form}><View style={s.card}><Text style={s.cardTitle}>Safe rehna zaroori hai</Text><Text style={[s.body, { marginTop: 8 }]}>Kisi ke saath password ya personal details share mat karo. Koi pareshan kare to uski profile se block ya report karo.</Text></View><View style={[s.card, { gap: 10 }]}><Text style={s.cardTitle}>Connection</Text><Text selectable style={s.small}>{API}</Text><View style={s.row}><View style={[s.liveDot, { backgroundColor: connected ? c.teal : c.red, width: 10, height: 10 }]} /><Text style={s.body}>{connected ? 'Connected' : 'Not connected'}</Text></View><Button small title="Reconnect" icon="refresh" soft onPress={() => { setRetry(x => x + 1); refresh(); }} /></View><View style={[s.card, { gap: 14 }]}><Text style={s.cardTitle}>Account</Text><Field label="Current password" value={password} onChangeText={setPassword} secure /><Field label="New password (min 8 characters)" value={newPassword} onChangeText={setNewPassword} secure /><Button title="Change password" soft disabled={busy || !password || newPassword.length < 8} onPress={() => act(async () => { await api('/me/password', 'POST', { currentPassword: password, newPassword }); setPassword(''); setNewPassword(''); setNotice('Password badal gaya. Baaki devices se logout ho gaye.'); })} /><Button title="Download my data" soft onPress={() => act(async () => { const d = await api('/me/export'); setNotice(`Data ready: ${d.messages.length} messages, ${d.posts.length} posts, ${d.ledger.length} wallet records.`); })} />{deleteArmed ? <><Text style={s.small}>Isse aapki profile hamesha ke liye delete ho jayegi. Upar password daalo, phir confirm karo.</Text><Button title="Yes, delete my account" disabled={busy || (!user?.demo && !password)} onPress={() => act(async () => { await api('/me', 'DELETE', { password }); await AsyncStorage.removeItem('melo-session'); socket.current?.disconnect(); setToken(''); setUser(null); setRoom(null); setDm(null); setMessages([]); setPage(''); setPassword(''); setDeleteArmed(false); setNotice('Account delete ho gaya.'); })} /><Button title="No, keep it" soft onPress={() => setDeleteArmed(false)} /></> : <Button title="Delete account" soft onPress={() => setDeleteArmed(true)} />}</View><Button title="Sign out" icon="log-out-outline" onPress={() => act(async () => { await api('/auth/logout', 'POST', {}); await AsyncStorage.removeItem('melo-session'); socket.current?.disconnect(); setToken(''); setUser(null); setRoom(null); setDm(null); setMessages([]); setPage(''); })} /><Text style={[s.tiny, { textAlign: 'center' }]}>Party App · version 0.1.0</Text></View>;

  const titles: Record<string, string> = { 'join-locked': 'Private room', 'room-settings': 'Room settings', 'create-room': 'New room', room: room?.title || 'Room', dm: dm?.name || 'Chat', games: 'Games', game: game?.type === 'connect-four' ? 'Connect Four' : 'Tic-tac-toe', pk: 'PK battle', wallet: 'Wallet', gifts: 'Send a gift', families: 'Families', events: 'Events', tasks: 'Daily rewards', leaderboard: 'Rankings', vip: 'VIP', store: 'Store', 'edit-profile': 'Edit profile', settings: 'Settings', decorations: 'Style shop', lucky: 'Lucky bag', queue: 'Mic queue', user: profile?.name || 'Profile', comments: 'Comments' };
  const tabs = [{ name: 'Party', icon: 'home-outline', active: 'home' }, { name: 'Discover', icon: 'compass-outline', active: 'compass' }, { name: 'Messages', icon: 'chatbubbles-outline', active: 'chatbubbles' }, { name: 'Profile', icon: 'person-circle-outline', active: 'person-circle' }] as const;

  return <View style={s.outer}><StatusBar style={token && !page ? 'light' : 'dark'} /><View style={s.shell}>{!token ? authScreen : <>
    {page ? <View style={[s.appBar, { paddingTop: insets.top + 8 }]}><Pressable accessibilityLabel="Go back" onPress={back} style={s.back}><Ionicons name="chevron-back" size={26} color={c.ink} /></Pressable><Text style={s.barTitle}>{titles[page]}</Text><View style={{ width: 42 }} /></View>
      : <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.topBar, { paddingTop: insets.top + 10 }]}><View style={{ flex: 1 }}><Text style={s.greet}>Namaste, {firstName(user?.name)} 👋</Text><Text style={s.topLogo}>Party App</Text></View><Pressable accessibilityLabel="Open wallet" onPress={openWallet} style={s.coinPill}><Text style={s.coinText}>🪙 {user?.coins ?? 0}</Text></Pressable><Pressable accessibilityLabel="Open profile" onPress={() => setTab('Profile')}><Avatar name={user?.name} emoji={user?.avatar} size={44} /></Pressable></LinearGradient>}
    {!connected && <Pressable accessibilityRole="button" onPress={() => { setRetry(x => x + 1); refresh(); }} style={s.connection}><Ionicons name="cloud-offline" size={18} color="#9A5B00" /><Text style={s.connectionText}>Live updates band hain · Tap to reconnect</Text></Pressable>}
    {!!error && <View style={s.errorBar}><Ionicons name="alert-circle" size={20} color={c.red} /><Text accessibilityRole="alert" style={[s.error, { flex: 1 }]}>{error}</Text><Pressable accessibilityLabel="Dismiss error" onPress={() => setError('')}><Ionicons name="close" size={22} color={c.red} /></Pressable></View>}
    {!!notice && <View accessibilityLiveRegion="polite" style={s.notice}><Ionicons name="checkmark-circle" color={c.teal} size={20} /><Text style={s.noticeText}>{notice}</Text></View>}
    {busy && <View style={s.progress}><ActivityIndicator size="small" color={c.pink} /><Text style={s.small}>Ek second…</Text></View>}
    <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={[s.content, page && { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">{loading && <ActivityIndicator style={{ marginVertical: 15 }} color={c.pink} />}{page ? detail : tab === 'Party' ? homeScreen : tab === 'Discover' ? feedScreen : tab === 'Messages' ? messagesScreen : profileScreen}</ScrollView>
    {!page && <View style={[s.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>{tabs.map(t => { const on = tab === t.name; return <Pressable accessibilityRole="tab" accessibilityState={{ selected: on }} key={t.name} style={s.navItem} onPress={() => { setTab(t.name); setText(''); }}>{on ? <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.navIcon}><Ionicons name={t.active} size={24} color="white" /></LinearGradient> : <View style={s.navIcon}><Ionicons name={t.icon} size={24} color={c.faint} /></View>}<Text style={[s.navLabel, on && { color: c.pink, fontWeight: '800' }]}>{t.name}</Text></Pressable>; })}</View>}
  </>}</View>{Platform.OS === 'web' && width > 1060 && <View style={s.desktopNote}><Text style={s.desktopLogo}>Party App</Text><Text style={s.desktopText}>Baatein, gaane{'\n'}aur naye dost.</Text></View>}</View>;
}

const shadow = Platform.select({ web: { boxShadow: '0 6px 20px rgba(123,47,247,0.10)' } as any, default: { shadowColor: '#7B2FF7', shadowOpacity: .12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 } });
const s = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#F6E9F7', flexDirection: 'row', justifyContent: 'center' },
  shell: { flex: 1, maxWidth: 520, backgroundColor: c.bg, overflow: 'hidden', ...Platform.select({ web: { height: '100%' as any, boxShadow: '0 0 80px rgba(123,47,247,0.15)' } }) },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingBottom: 14 },
  greet: { color: '#FFFFFFE6', fontSize: 15, fontWeight: '600' },
  topLogo: { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -.5 },
  coinPill: { backgroundColor: '#FFFFFF2E', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9 },
  coinText: { color: 'white', fontSize: 16, fontWeight: '800' },
  appBar: { paddingHorizontal: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderColor: c.line },
  barTitle: { fontSize: 19, fontWeight: '800', color: c.ink, flex: 1, textAlign: 'center' },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7EEF8' },
  content: { padding: 18, paddingTop: 20, paddingBottom: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 26, fontWeight: '900', color: c.ink },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 6, gap: 10 },
  sectionTitle: { fontSize: 21, fontWeight: '900', color: c.ink, letterSpacing: -.3 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: c.ink },
  body: { color: c.text, fontSize: 16, lineHeight: 24 },
  bodyMuted: { fontSize: 16, color: c.muted, lineHeight: 24, marginBottom: 6 },
  small: { fontSize: 14, color: c.muted, lineHeight: 20 },
  tiny: { fontSize: 12.5, color: c.faint, lineHeight: 17 },
  label: { fontSize: 15, color: c.text, fontWeight: '700' },
  link: { fontSize: 15, fontWeight: '800', color: c.pink },
  linkPill: { backgroundColor: '#FFE3EE', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  hero: { borderRadius: 28, padding: 22, overflow: 'hidden', ...shadow },
  heroBlobA: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFFFFF1F', right: -50, top: -60 },
  heroBlobB: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#FF9F1C40', right: 30, bottom: -70 },
  liveTag: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#00000026', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 11 },
  liveDot: { width: 8, height: 8, backgroundColor: '#7CFFB2', borderRadius: 5 },
  liveText: { fontSize: 13, color: 'white', fontWeight: '800' },
  heroTitle: { fontSize: 34, color: 'white', fontWeight: '900', lineHeight: 40, marginTop: 14, letterSpacing: -.5 },
  heroSub: { fontSize: 16, color: '#FFFFFFE0', marginTop: 8, lineHeight: 22 },
  heroButton: { backgroundColor: 'white', flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16 },
  heroButtonText: { color: c.pink, fontSize: 16, fontWeight: '900' },
  heroGhost: { borderWidth: 2, borderColor: '#FFFFFF80', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  heroGhostText: { color: 'white', fontSize: 16, fontWeight: '800' },
  shortcuts: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 22 },
  shortcut: { alignItems: 'center', gap: 8, flex: 1 },
  shortcutIcon: { width: 58, height: 58, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  shortcutLabel: { fontSize: 13.5, color: c.text, fontWeight: '700', textAlign: 'center' },
  onlineItem: { alignItems: 'center', gap: 6, width: 72 },
  onlineDot: { position: 'absolute', right: 3, bottom: 3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22C55E', borderWidth: 3, borderColor: 'white' },
  onlineName: { fontSize: 13.5, color: c.text, fontWeight: '700', textAlign: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 18, paddingHorizontal: 16, gap: 10, minHeight: 54, borderWidth: 1.5, borderColor: c.line },
  searchInput: { flex: 1, fontSize: 16, color: c.ink, paddingVertical: 12, ...Platform.select({ web: { outlineStyle: 'none' as any } }) },
  chips: { gap: 10, paddingVertical: 16, paddingRight: 10 },
  chip: { borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11 },
  chipIdle: { backgroundColor: 'white', borderWidth: 1.5, borderColor: c.line },
  chipText: { fontSize: 15, fontWeight: '800', color: c.text },
  roomCard: { backgroundColor: 'white', borderRadius: 26, overflow: 'hidden', marginBottom: 18, ...shadow },
  roomCover: { minHeight: 150, padding: 16, overflow: 'hidden', justifyContent: 'space-between' },
  coverRing: { position: 'absolute', width: 190, height: 190, right: -50, top: -40, borderRadius: 100, borderWidth: 28, borderColor: '#FFFFFF22' },
  roomBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0000002E', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  roomBadgeText: { fontSize: 13, color: 'white', fontWeight: '800' },
  coverArt: { position: 'absolute', fontSize: 64, right: 22, top: 38, transform: [{ rotate: '-10deg' }] },
  coverTitle: { color: 'white', fontSize: 23, fontWeight: '900', marginTop: 44, paddingRight: 80, lineHeight: 29 },
  roomInfo: { padding: 16 },
  roomDescription: { fontSize: 15.5, color: c.text, lineHeight: 22 },
  joinPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.pink, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  joinText: { color: 'white', fontWeight: '900', fontSize: 15 },
  createStrip: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, marginTop: 6, backgroundColor: 'white', borderWidth: 2, borderStyle: 'dashed', borderColor: '#FFB8CF' },
  createIcon: { height: 48, width: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bottomNav: { flexDirection: 'row', backgroundColor: 'white', paddingTop: 10, borderTopWidth: 1, borderColor: c.line },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navIcon: { width: 54, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  navLabel: { color: c.faint, fontSize: 13, fontWeight: '600' },
  button: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 15, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  buttonSmall: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  softButton: { backgroundColor: '#F1E8FF' },
  buttonText: { color: 'white', fontSize: 16.5, fontWeight: '800' },
  form: { gap: 16, paddingVertical: 6 },
  input: { backgroundColor: 'white', borderWidth: 1.5, borderColor: c.line, borderRadius: 16, padding: 15, fontSize: 16, color: c.ink },
  card: { backgroundColor: 'white', padding: 18, borderRadius: 22, marginVertical: 8, ...shadow },
  compose: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'white', borderRadius: 22, padding: 12, marginBottom: 12, ...shadow },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  postActions: { flexDirection: 'row', gap: 10 },
  actionPill: { backgroundColor: '#F7F1FA', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, gap: 6 },
  actionText: { fontSize: 15, color: c.text, fontWeight: '700' },
  vipBadge: { fontSize: 11.5, fontWeight: '900', color: '#9A5B00', backgroundColor: '#FFE9B8', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  menuCard: { backgroundColor: 'white', borderRadius: 24, paddingHorizontal: 16, marginTop: 6, ...shadow },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderColor: c.line },
  menuText: { fontSize: 16.5, color: c.ink, fontWeight: '700' },
  tile: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  profileHead: { alignItems: 'center', gap: 8, padding: 24, borderRadius: 28, marginBottom: 16, overflow: 'hidden' },
  profileName: { fontSize: 25, fontWeight: '900', color: 'white', marginTop: 6, textAlign: 'center' },
  profileBio: { fontSize: 15.5, color: '#FFFFFFE6', textAlign: 'center', lineHeight: 22 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF26', borderRadius: 18, paddingVertical: 12, marginTop: 10, alignSelf: 'stretch' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: 'white', fontSize: 21, fontWeight: '900' },
  statLabel: { color: '#FFFFFFD9', fontSize: 13, fontWeight: '600' },
  statLine: { width: 1, height: 30, backgroundColor: '#FFFFFF55' },
  walletBanner: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 14 },
  walletHero: { padding: 24, borderRadius: 26, gap: 6 },
  walletLabel: { color: '#FFFFFFE6', fontSize: 15, fontWeight: '700' },
  walletCoins: { color: 'white', fontSize: 32, fontWeight: '900', marginVertical: 4 },
  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  roomStage: { padding: 18, borderRadius: 28, overflow: 'hidden' },
  stageCat: { color: 'white', fontSize: 14, fontWeight: '800' },
  stageTitle: { fontSize: 26, color: 'white', fontWeight: '900', marginTop: 14, lineHeight: 32 },
  stageDesc: { fontSize: 15, color: '#FFFFFFD9', marginTop: 6, lineHeight: 21 },
  seats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, rowGap: 16 },
  seatCell: { width: '25%', alignItems: 'center', gap: 6 },
  seatEmpty: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF1F', borderWidth: 2, borderStyle: 'dashed', borderColor: '#FFFFFF80', alignItems: 'center', justifyContent: 'center' },
  seatName: { color: 'white', fontSize: 13.5, fontWeight: '700', textAlign: 'center' },
  muteBadge: { position: 'absolute', right: 0, bottom: 0, backgroundColor: c.red, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  stageControls: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 22 },
  roundBtn: { alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF2E', paddingVertical: 12, borderRadius: 20, width: '30%' },
  roundLabel: { color: 'white', fontSize: 13.5, fontWeight: '800' },
  roomTools: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 22, padding: 14, marginVertical: 16, ...shadow },
  toolItem: { alignItems: 'center', gap: 7, flex: 1 },
  toolLabel: { fontSize: 13.5, color: c.text, fontWeight: '700', textAlign: 'center' },
  serviceNote: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#F1E8FF', borderRadius: 18, marginVertical: 14 },
  messagesArea: { paddingVertical: 10, gap: 12 },
  chatBubble: { backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderBottomLeftRadius: 6, gap: 2, flexShrink: 1, borderWidth: 1, borderColor: c.line },
  ownBubble: { borderBottomLeftRadius: 20, borderBottomRightRadius: 6, borderWidth: 0 },
  chatAuthor: { fontSize: 13.5, color: c.violet, fontWeight: '800' },
  chatTime: { fontSize: 11.5, color: c.faint, marginTop: 3 },
  composer: { flexDirection: 'row', gap: 10, paddingLeft: 16, paddingRight: 8, paddingVertical: 6, backgroundColor: 'white', borderRadius: 26, alignItems: 'center', marginVertical: 12, borderWidth: 1.5, borderColor: c.line },
  giftGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 16 },
  gift: { width: '47.5%', borderWidth: 2, borderColor: 'transparent', borderRadius: 22, padding: 16, alignItems: 'center', gap: 8, backgroundColor: 'white', ...shadow },
  giftIcon: { width: 70, height: 70, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  price: { fontSize: 15, fontWeight: '800', color: c.mango },
  personChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', borderWidth: 2, borderColor: c.line, borderRadius: 22, paddingVertical: 6, paddingLeft: 6, paddingRight: 14 },
  familyBadge: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  eventArt: { height: 140, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 10 },
  eventTag: { color: 'white', fontSize: 15, fontWeight: '800', backgroundColor: '#0000002E', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' },
  podium: { borderRadius: 28, padding: 20, marginBottom: 16 },
  podiumTitle: { color: 'white', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: 28 },
  podiumItem: { alignItems: 'center', gap: 6, width: '31%' },
  podiumName: { color: 'white', fontSize: 15.5, fontWeight: '900', textAlign: 'center' },
  podiumScore: { color: 'white', fontSize: 14, fontWeight: '700', backgroundColor: '#0000002E', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  rankNum: { fontSize: 18, fontWeight: '900', color: c.faint, width: 28, textAlign: 'center' },
  score: { fontSize: 16, fontWeight: '900', color: c.violet },
  pkHero: { padding: 22, borderRadius: 26, alignItems: 'center', gap: 6 },
  pkTitle: { color: 'white', fontSize: 26, fontWeight: '900' },
  pkSub: { color: '#FFFFFFE6', fontSize: 15.5, textAlign: 'center', lineHeight: 22 },
  vipHero: { padding: 26, borderRadius: 26, alignItems: 'center', gap: 6, marginBottom: 8 },
  statusPill: { backgroundColor: '#F1E8FF', borderRadius: 18, padding: 14, alignItems: 'center' },
  statusText: { fontSize: 17, fontWeight: '800', color: c.violet, textAlign: 'center' },
  c4Board: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', padding: 10, backgroundColor: c.blue, borderRadius: 20 },
  gameTile: { borderRadius: 24, padding: 20, alignItems: 'center', gap: 10, minHeight: 140, justifyContent: 'center' },
  gameTileText: { color: 'white', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  empty: { padding: 30, gap: 10, alignItems: 'center' },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFE3EE', alignItems: 'center', justifyContent: 'center' },
  connection: { flexDirection: 'row', gap: 8, backgroundColor: '#FFF0D9', padding: 11, alignItems: 'center', justifyContent: 'center' },
  connectionText: { color: '#9A5B00', fontSize: 14, fontWeight: '700' },
  errorBar: { backgroundColor: '#FFE8EA', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  error: { color: '#B4232A', fontSize: 14.5, lineHeight: 20, textAlign: 'center' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#DDF7F1', paddingHorizontal: 16, paddingVertical: 12 },
  noticeText: { flex: 1, fontSize: 15, color: '#0B6B5A', lineHeight: 21, fontWeight: '600' },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 8 },
  auth: { paddingHorizontal: 22, alignItems: 'center', gap: 14 },
  brandIcon: { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  wordmark: { fontSize: 34, fontWeight: '900', color: c.ink, letterSpacing: -1 },
  authTitle: { textAlign: 'center', fontSize: 28, lineHeight: 36, color: c.pink, fontWeight: '900' },
  authNote: { textAlign: 'center', color: c.muted, fontSize: 16, lineHeight: 24 },
  authCard: { padding: 22, gap: 16, backgroundColor: 'white', borderRadius: 28, alignSelf: 'stretch', marginVertical: 10, ...shadow },
  divider: { height: 1, backgroundColor: c.line },
  desktopNote: { position: 'absolute', left: 42, bottom: 50, display: Platform.OS === 'web' ? 'flex' : 'none', pointerEvents: 'none' },
  desktopLogo: { fontSize: 32, fontWeight: '900', color: c.violet },
  desktopText: { marginTop: 10, fontSize: 18, lineHeight: 26, color: c.muted },
});
