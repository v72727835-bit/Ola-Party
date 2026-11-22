import * as ImagePicker from 'expo-image-picker';
import { Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item } from '../types';
import type { AppState } from './context';

// Values and actions PartyApp computes once the saved session has loaded.
export function deriveApp(app: AppState) {
  const {
    act, api, conversations, filteredRooms, homeTab, loadCatalog, navigate, notifUnread, recipient, room,
    seatedIds, setBirthday, setDescription, setError, setGender, setHometown, setName, setNotice, setPage,
    setRecipient, setSheet, setTab, setTagsText, setToken, setUser, user
  } = app;
  const following: string[] = user?.following || [];
  const unread = conversations.filter(cv => cv.lastMessage && cv.lastMessage.fromId !== user?.id).length + notifUnread;
  const listRooms = filteredRooms.filter(r => homeTab !== 'Follow' || following.includes(r.ownerId) || r.members?.some((m: string) => following.includes(m)));
  const openGifts = () => { if (!recipient || !room?.members?.includes(recipient)) setRecipient(seatedIds.find(id => id !== user?.id) || room?.members?.find((m: string) => m !== user?.id) || ''); setSheet('gift'); };
  const toggleFollow = (id: string) => act(async () => { const on = following.includes(id); await api(`/users/${id}/follow`, on ? 'DELETE' : 'POST', {}); setUser(prev => prev ? { ...prev, following: on ? (prev.following || []).filter((x: string) => x !== id) : [...(prev.following || []), id] } : prev); });
  const openEdit = () => { setName(user?.name || ''); setDescription(user?.bio || ''); setHometown(user?.hometown || ''); setBirthday(user?.birthday || ''); setGender(user?.gender || ''); setTagsText((user?.tags || []).join(', ')); navigate('edit-profile'); };
  const pickPhoto = () => act(async () => { const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: .35, base64: true }); if (res.canceled || !res.assets?.[0]?.base64) return; const a = res.assets[0]; const type = a.mimeType && /png|webp/.test(a.mimeType) ? a.mimeType : 'image/jpeg'; const data = `data:${type};base64,${a.base64}`; if (data.length > 590000) throw new Error('Photo bahut badi hai. Chhoti photo chuno ya crop karo.'); const u = await api('/me/photo', 'POST', { data }); setUser(prev => prev ? { ...prev, photo: u.photo } : prev); setNotice('Profile photo update ho gayi.'); });
  const isMod = !!room && (room.ownerId === user?.id || (room.admins || []).includes(user?.id));
  const friendIds = new Set<string>([...(user?.following || []), ...(user?.followers || [])]);
  const knownConvs = conversations.filter(cv => friendIds.has(cv.user.id)); const strangerConvs = conversations.filter(cv => !friendIds.has(cv.user.id));
  const shareRoom = () => { if (room) Share.share({ message: `"${room.title}" room mein aao, Party App par. Room ID: ${room.code || room.id}` }).catch(() => {}); };
  const banners = [
    { title: 'Antakshari Mahamuqabla', sub: 'Teams of 4. Winner gets the Crown badge.', cta: 'See events', colors: ['#FF2E74', '#8B3DFF'] as [string, string], go: () => loadCatalog('events') },
    { title: 'Daily rewards are live', sub: 'Check in, send a gift, earn free coins.', cta: 'Claim now', colors: ['#00B89C', '#3D7BFF'] as [string, string], go: () => loadCatalog('tasks') },
    { title: 'Find your family', sub: 'Join a crew and climb the family rankings.', cta: 'Explore', colors: ['#FFB21C', '#FF2E74'] as [string, string], go: () => loadCatalog('families') },
  ];
  const saveSession = async (data: Item) => { await AsyncStorage.setItem('melo-session', JSON.stringify(data)); setError(''); setNotice(''); setUser(data.user); setToken(data.token); setTab('Party'); setPage(''); };

  return {
    ...app,
    following, unread, listRooms, openGifts, toggleFollow, openEdit, pickPhoto, isMod, friendIds, knownConvs,
    strangerConvs, shareRoom, banners, saveSession,
  };
}
