import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated, BackHandler, Easing, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Socket, io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item, MIcon } from '../types';
import { AudioConnection, connectAudio } from '../../audio';
import { API } from '../theme';
import { rememberGifts } from '../../GiftDrawer';

// All app state, socket wiring, effects and actions that used to live at the top of PartyApp.
export function useAppState() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [token, setToken] = useState(''); const [user, setUser] = useState<Item | null>(null); const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState('Party'); const [page, setPage] = useState(''); const [rooms, setRooms] = useState<Item[]>([]); const [posts, setPosts] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<Record<string, Item[]>>({}); const [room, setRoom] = useState<Item | null>(null); const [messages, setMessages] = useState<Item[]>([]);
  const [dm, setDm] = useState<Item | null>(null); const [conversations, setConversations] = useState<Item[]>([]); const [wallet, setWallet] = useState<Item | null>(null);
  const [q, setQ] = useState(''); const [category, setCategory] = useState('All'); const [notice, setNotice] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false); const [retry, setRetry] = useState(0); const socket = useRef<Socket | null>(null);
   const [bags, setBags] = useState<Item[]>([]); const [bagTotal, setBagTotal] = useState('100'); const [bagCount, setBagCount] = useState('5'); const [queue, setQueue] = useState<Item[]>([]); const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const [text, setText] = useState(''); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [formCategory, setFormCategory] = useState('Chill');
  const [giftFromDm, setGiftFromDm] = useState(false); const [recipient, setRecipient] = useState(''); const [profile, setProfile] = useState<Item | null>(null); const [comments, setComments] = useState<Item[]>([]); const [post, setPost] = useState<Item | null>(null);
  const audioRef = useRef<AudioConnection | null>(null); const [audioConnected, setAudioConnected] = useState(false); const [micOn, setMicOn] = useState(false);
  const [game, setGame] = useState<Item | null>(null); const [battle, setBattle] = useState<Item | null>(null);
  const [pendingRoom, setPendingRoom] = useState<Item | null>(null); const [giftEvent, setGiftEvent] = useState<Item | null>(null); const [entrance, setEntrance] = useState<Item | null>(null); const [notifs, setNotifs] = useState<Item[]>([]); const [notifUnread, setNotifUnread] = useState(0);
  const activeChat = useRef<{ page: string; roomId?: string; peerId?: string; userId?: string }>({ page: '' });

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
  useEffect(() => { if (token) api('/gifts').then(rememberGifts).catch(() => {}); }, [token]);
  useEffect(() => { if (!token) return; const client = io(API.replace(/\/api$/, ''), { auth: { token }, reconnectionAttempts: Infinity, reconnectionDelayMax: 10000 }); socket.current = client;
    client.on('connect', () => setConnected(true)); client.on('disconnect', () => setConnected(false)); client.on('connect_error', () => setConnected(false));
    client.on('room:updated', (r: Item) => { setRooms(prev => prev.map(x => x.id === r.id ? r : x)); setRoom(prev => prev?.id === r.id ? r : prev); });
    const add = (m: Item) => { const active = activeChat.current; const belongs = m.roomId ? active.page === 'room' && m.roomId === active.roomId : active.page === 'dm' && ((m.fromId === active.peerId && m.toId === active.userId) || (m.fromId === active.userId && m.toId === active.peerId)); if (belongs) setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]); };
    client.on('room:message', add); client.on('dm:message', (m: Item) => { add(m); api('/conversations').then(setConversations).catch(() => {}); });
    client.on('wallet:updated', (w: Item) => { setUser(prev => prev ? { ...prev, ...w } : prev); setWallet(prev => prev ? { ...prev, ...w } : prev); });
    client.on('room:seat-invite', setSeatInvite); client.on('gift:broadcast', (t: Item) => setNotice(`${t.from?.name} sent ${t.giftName} x${t.quantity} to ${t.to?.name}!`));
    client.on('gift:sent', (t: Item) => setGiftEvent({ ...t, key: `${t.id}-${Date.now()}` })); client.on('room:queue', (q: Item[]) => setQueue(q)); client.on('room:lucky-bag', () => setNotice('Lucky bag aaya hai! Jaldi grab karo.'));
    client.on('game:updated', (g: Item) => setGame(prev => prev?.id === g.id ? g : prev)); client.on('notification', (n: Item) => { setNotifUnread(x => x + 1); if (n.type !== 'visit') setNotice(n.text); }); client.on('room:entrance', (e: Item) => setEntrance({ ...e, key: `${e.user?.id}-${Date.now()}` }));
    client.on('pk:updated', () => setNotice('PK battle update hua. Score dekho.'));
    return () => { client.disconnect(); socket.current = null; };
  }, [token, retry]);
  useEffect(() => { if (room && connected) socket.current?.emit('room:subscribe', room.id); }, [room?.id, connected]);
  const currentSeat = room?.seats?.find((seat: Item) => seat.userId === user?.id);
  useEffect(() => { if (!audioRef.current) return; stopAudio().catch(() => {}); }, [room?.id, currentSeat?.index, currentSeat?.muted, room?.members?.includes(user?.id)]);
  useEffect(() => () => { audioRef.current?.disconnect().catch(() => {}); }, []);
  useEffect(() => { if (!token) stopAudio().catch(() => {}); }, [token]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(t); }, [notice]);

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
  const featureButtons: { name: string; note: string; key: string; icon: MIcon; colors: [string, string] }[] = [{ name: 'Rankings', note: 'Top gifters', key: 'leaderboard', icon: 'crown', colors: ['#FFB21C', '#FF6A00'] }, { name: 'Events', note: 'This week', key: 'events', icon: 'calendar-star', colors: ['#FF2E74', '#C026D3'] }, { name: 'Families', note: 'Find your gang', key: 'families', icon: 'account-group', colors: ['#8B3DFF', '#3D7BFF'] }, { name: 'Rewards', note: 'Free coins', key: 'tasks', icon: 'gift', colors: ['#00B89C', '#0EA5E9'] }];
  const filteredRooms = rooms.filter(r => (category === 'All' || r.category?.toLowerCase() === category.toLowerCase()) && `${r.title} ${r.description} ${r.category} ${r.code || ''}`.toLowerCase().includes(q.toLowerCase()));
  const back = page === 'gifts' && giftFromDm && dm ? () => { setGiftFromDm(false); navigate('dm'); } : page === 'room' ? () => navigate('') : room && ['games', 'game', 'pk', 'gifts', 'user', 'room-settings', 'queue', 'lucky'].includes(page) ? () => navigate('room') : goHome;


  const scrollRef = useRef<ScrollView>(null);
  const chatRef = useRef<ScrollView>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [page, tab]);
  const [homeTab, setHomeTab] = useState('Live'); const [exploreTab, setExploreTab] = useState('Square'); const [meTab, setMeTab] = useState('About me');
  const [people, setPeople] = useState<Item[]>([]); const [sheet, setSheet] = useState<'' | 'gift' | 'more' | 'theme'>('');
  const [showRoomTasks, setShowRoomTasks] = useState(false);
  const [roomProfile, setRoomProfile] = useState<string | null>(null); const [seatMenu, setSeatMenu] = useState<Item | null>(null); const [inviting, setInviting] = useState(false); const [seatInvite, setSeatInvite] = useState<Item | null>(null);
  const [honor, setHonor] = useState<Item[]>([]); const [visitors, setVisitors] = useState<Item[]>([]); const [peopleQ, setPeopleQ] = useState(''); const [found, setFound] = useState<Item[]>([]); const [burst, setBurst] = useState<Item | null>(null); const [pickColor, setPickColor] = useState<string | null>(null); const [unoHand, setUnoHand] = useState<Item>({ cards: [], playable: [] });
  const [hometown, setHometown] = useState(''); const [birthday, setBirthday] = useState(''); const [gender, setGender] = useState(''); const [tagsText, setTagsText] = useState(''); const [entryShow, setEntryShow] = useState<Item | null>(null);
  const entryX = useRef(new Animated.Value(-520)).current; const [banner, setBanner] = useState<Item | null>(null); const [speakers, setSpeakers] = useState<string[]>([]); const [slide, setSlide] = useState(0);
  const bannerX = useRef(new Animated.Value(500)).current;
  const joinedAt = useRef<{ id?: string; at: string }>({ at: '' });
  if (room && joinedAt.current.id !== room.id) joinedAt.current = { id: room.id, at: new Date().toISOString() };

  const allPeople: Record<string, Item> = {}; for (const r of rooms) for (const p of r.people || []) allPeople[p.id] = p; for (const p of room?.people || []) allPeople[p.id] = p;
  const who = (id?: string): Item => id === user?.id ? { ...user, name: 'You' } : allPeople[id || ''] || { id, name: 'Guest' };
  const seatedIds: string[] = (room?.seats || []).map((x: Item) => x.userId).filter(Boolean);

  // Android hardware back button
  useEffect(() => { if (Platform.OS !== 'android') return; const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (showRoomTasks) { setShowRoomTasks(false); return true; } if (roomProfile) { setRoomProfile(null); return true; } if (seatMenu) { setSeatMenu(null); return true; } if (sheet) { setSheet(''); return true; } if (page) { back(); return true; } if (tab !== 'Party') { setTab('Party'); return true; } return false; }); return () => sub.remove(); });
  useEffect(() => { if (token && tab === 'Explore' && !people.length) api('/rankings?period=all').then((d: Item[]) => setPeople(d.map(x => x.user))).catch(() => {}); }, [token, tab]);
  useEffect(() => { if (!giftEvent || giftEvent.roomId !== room?.id) return; setBanner({ ...giftEvent, key: giftEvent.key, from: who(giftEvent.fromId), to: who(giftEvent.recipientId), giftId: giftEvent.giftId, qty: giftEvent.quantity || 1 }); }, [giftEvent?.key]);
  // Demo rooms only: simulate who is talking and the odd gift so the sample rooms feel alive. Real rooms show real events only.
  useEffect(() => { if (page !== 'room' || !room?.demo) { setSpeakers(micOn && user ? [user.id] : []); return; } let tick = 0; const t = setInterval(() => { tick++; const others = seatedIds.filter(id => id !== user?.id); const pick = others.filter(() => Math.random() < .35).slice(0, 2); setSpeakers([...pick, ...(micOn && user ? [user.id] : [])]); if (tick % 4 === 0 && others.length > 1) { const a = others[Math.floor(Math.random() * others.length)]; const rest = others.filter(x => x !== a); const b2 = rest[Math.floor(Math.random() * rest.length)]; const g = ['rose', 'heart', 'crown', 'rocket'][Math.floor(Math.random() * 4)]; setBanner({ key: `demo-${Date.now()}`, from: who(a), to: who(b2), giftId: g, qty: [1, 1, 5, 10][Math.floor(Math.random() * 4)] }); } }, 2800); return () => clearInterval(t); }, [page, room?.id, micOn, seatedIds.join()]);
  useEffect(() => { if (!token) return; api('/me/notifications').then((n: Item[]) => { setNotifs(n); setNotifUnread(n.filter(x => !x.read).length); }).catch(() => {}); }, [token]);
  useEffect(() => { const id = page === 'user' ? profile?.id : !page && tab === 'Me' ? user?.id : null; if (!token || !id) return; setHonor([]); api(`/users/${id}/honor`).then(setHonor).catch(() => {}); }, [token, page, tab, profile?.id]);
  useEffect(() => { if (!peopleQ.trim()) { setFound([]); return; } const t = setTimeout(() => api('/people/search?q=' + encodeURIComponent(peopleQ.trim())).then(setFound).catch(() => {}), 350); return () => clearTimeout(t); }, [peopleQ]);
  useEffect(() => { if (page !== 'game' || game?.type !== 'uno' || game.status === 'waiting' || !game.playerIds?.includes(user?.id)) return; api(`/games/${game.id}/uno-hand`).then(setUnoHand).catch(() => {}); }, [page, game?.id, game?.turn, game?.top?.id, game?.phase, JSON.stringify(game?.counts || {})]);
  useEffect(() => { if (banner) setBurst({ ...banner, key: 'b' + banner.key }); }, [banner?.key]);
  useEffect(() => { if (!entrance || entrance.roomId !== room?.id || entrance.user?.id === user?.id) return; setEntryShow(entrance); entryX.setValue(-520); Animated.sequence([Animated.timing(entryX, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.1)), useNativeDriver: Platform.OS !== 'web' }), Animated.delay(2400), Animated.timing(entryX, { toValue: 520, duration: 400, useNativeDriver: Platform.OS !== 'web' })]).start(() => setEntryShow(x => x?.key === entrance.key ? null : x)); }, [entrance?.key]);
  useEffect(() => { if (!banner) return; bannerX.setValue(500); Animated.sequence([Animated.timing(bannerX, { toValue: 0, duration: 450, easing: Easing.out(Easing.back(1.2)), useNativeDriver: Platform.OS !== 'web' }), Animated.delay(2600), Animated.timing(bannerX, { toValue: -520, duration: 400, useNativeDriver: Platform.OS !== 'web' })]).start(() => setBanner(x => x?.key === banner.key ? null : x)); }, [banner?.key]);
  useEffect(() => { if (page === 'room') setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 150); }, [messages.length, page]);
  useEffect(() => { const t = setInterval(() => setSlide(x => (x + 1) % 3), 4500); return () => clearInterval(t); }, []);

  return {
    insets, width, token, setToken, user, setUser, hydrated, setHydrated, tab, setTab, page, setPage, rooms,
    setRooms, posts, setPosts, catalog, setCatalog, room, setRoom, messages, setMessages, dm, setDm, conversations,
    setConversations, wallet, setWallet, q, setQ, category, setCategory, notice, setNotice, error, setError, busy,
    setBusy, loading, setLoading, connected, setConnected, retry, setRetry, socket, bags, setBags, bagTotal,
    setBagTotal, bagCount, setBagCount, queue, setQueue, password, setPassword, name, setName, text, setText,
    title, setTitle, description, setDescription, formCategory, setFormCategory, giftFromDm, setGiftFromDm,
    recipient, setRecipient, profile, setProfile, comments, setComments, post, setPost, audioRef, audioConnected,
    setAudioConnected, micOn, setMicOn, game, setGame, battle, setBattle, pendingRoom, setPendingRoom, giftEvent,
    setGiftEvent, entrance, setEntrance, notifs, setNotifs, notifUnread, setNotifUnread, activeChat, stopAudio,
    api, act, refresh, currentSeat, navigate, loadCatalog, openWallet, enterRoom, leaveRoom, openDm, sendMessage,
    seatAction, openProfile, joinAudio, toggleMic, goHome, featureButtons, filteredRooms, back, scrollRef, chatRef,
    homeTab, setHomeTab, exploreTab, setExploreTab, meTab, setMeTab, people, setPeople, sheet, setSheet,
    showRoomTasks, setShowRoomTasks, roomProfile, setRoomProfile, seatMenu, setSeatMenu, inviting, setInviting,
    seatInvite, setSeatInvite, honor, setHonor, visitors, setVisitors, peopleQ, setPeopleQ, found, setFound, burst,
    setBurst, pickColor, setPickColor, unoHand, setUnoHand, hometown, setHometown, birthday, setBirthday, gender,
    setGender, tagsText, setTagsText, entryShow, setEntryShow, entryX, banner, setBanner, speakers, setSpeakers,
    slide, setSlide, bannerX, joinedAt, allPeople, who, seatedIds,
  };
}
