import React from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Item } from '../types';
import { s } from '../styles';
import { Button, GiftArt, GiftBurst, Level, Photo, SpeakRing } from '../components/ui';
import { THEMES, c, frameColors } from '../theme';
import { firstName, shortId } from '../utils';
import GiftDrawer from '../../GiftDrawer';
import RoomTasks from '../../RoomTasks';
import RoomProfile from '../../RoomProfile';
import type { AppCtx } from '../state/context';

export function renderRoom(ctx: AppCtx) {
  const {
    act, api, audioConnected, banner, bannerX, burst, chatRef, currentSeat, entryShow, entryX, error, following,
    insets, inviting, isMod, joinAudio, joinedAt, leaveRoom, loadCatalog, messages, micOn, navigate, notice,
    openGifts, openProfile, openWallet, recipient, refresh, room, roomProfile, seatAction, seatInvite, seatMenu,
    seatedIds, sendMessage, setBags, setBattle, setDescription, setError, setGiftEvent, setInviting, setNotice,
    setPassword, setQueue, setRecipient, setRoom, setRoomProfile, setSeatInvite, setSeatMenu, setSheet,
    setShowRoomTasks, setText, setTitle, shareRoom, sheet, showRoomTasks, speakers, text, toggleFollow, toggleMic,
    user, who, width
  } = ctx;
  const seatView = (seat: Item) => { const p = seat.userId ? who(seat.userId) : null; const isHost = !!seat.userId && seat.userId === room?.ownerId; return <View key={seat.index} style={s.seatCell}>
    <Pressable accessibilityLabel={`Seat ${seat.index + 1}${seat.locked ? ' locked' : ''}`} onLongPress={() => { setSeatMenu(seat); setInviting(false); }} onPress={() => { if (seat.userId) setRoomProfile(seat.userId); else { setSeatMenu(seat); setInviting(false); } }} style={[s.seatHit, sheet === 'gift' && { width: 56, height: 56 }]}>
      {p ? <><SpeakRing active={speakers.includes(p.id)} size={sheet === 'gift' ? 52 : 68} /><Photo uri={p.photo} name={p.name} size={sheet === 'gift' ? 42 : 58} ring ringColors={frameColors(p.equipped) || (isHost ? ['#FFE08A', '#FF9F1C'] : ['#B794FF', '#FF5C9A'])} />{!isHost && (room?.admins || []).includes(p.id) && <View style={s.adminTag}><Text style={s.adminTagText}>Admin</Text></View>}{isHost && <View style={s.crown}><MaterialCommunityIcons name="crown" size={18} color={c.gold} /></View>}{seat.muted && <View style={s.muteBadge}><Ionicons name="mic-off" size={11} color="white" /></View>}</>
        : <View style={[s.seatEmpty, sheet === 'gift' && { width: 44, height: 44, borderRadius: 22 }]}>{seat.locked ? <Ionicons name="lock-closed" size={20} color="#FFFFFFB3" /> : <MaterialCommunityIcons name="plus" size={24} color="#FFFFFFB3" />}</View>}
    </Pressable>
    <Text style={s.seatName} numberOfLines={1}>{p ? firstName(p.name) : `No.${seat.index + 1}`}</Text>
    {sheet !== 'gift' && (p ? <View style={{ alignItems: 'center' }}><Level level={p.level || 1} /></View> : <View style={{ height: 18 }} />)}
  </View>; };
  const roomMessages = messages.filter(m => m.roomId === room?.id);
  const firstAfterJoin = roomMessages.find(m => m.createdAt >= joinedAt.current.at);
  const roomTools: { t: string; i: Icon; col: [string, string]; fn: () => void }[] = room ? [
    { t: 'Star Tasks', i: 'star', col: ['#FFB21C', '#FF6A00'], fn: () => { setSheet(''); setShowRoomTasks(true); } },
    { t: 'Games', i: 'game-controller', col: ['#8B3DFF', '#3D7BFF'], fn: () => { setSheet(''); loadCatalog('games'); } },
    { t: 'Mic queue', i: 'hand-left', col: ['#00B89C', '#0EA5E9'], fn: () => { setSheet(''); act(async () => { setQueue(await api(`/rooms/${room.id}/queue`)); navigate('queue'); }); } },
    { t: 'Lucky bag', i: 'cash', col: ['#FF6A00', '#E5484D'], fn: () => { setSheet(''); act(async () => { setBags(await api(`/rooms/${room.id}/lucky-bags`)); navigate('lucky'); }); } },
    { t: 'PK battle', i: 'flash', col: ['#FFB21C', '#FF2E74'], fn: () => { setSheet(''); act(async () => { setBattle(await api(`/rooms/${room.id}/pk`)); navigate('pk'); }); } },
    { t: audioConnected ? 'Leave audio' : 'Listen live', i: 'headset', col: ['#3D7BFF', '#6366F1'], fn: () => { setSheet(''); joinAudio(); } },
    ...(room.ownerId === user?.id ? [{ t: room.locked ? 'Unlock room' : 'Lock room', i: (room.locked ? 'lock-open' : 'lock-closed') as Icon, col: ['#64748B', '#334155'] as [string, string], fn: () => { setSheet(''); act(async () => { await api(`/rooms/${room.id}`, 'PATCH', { locked: !room.locked }); setRoom(await api(`/rooms/${room.id}`)); }); } }, { t: 'Settings', i: 'settings' as Icon, col: ['#C026D3', '#8B3DFF'] as [string, string], fn: () => { setSheet(''); setTitle(room.title); setDescription(room.description || ''); setPassword(''); navigate('room-settings'); } }] : []),
    ...(isMod ? [{ t: 'Theme', i: 'color-palette' as Icon, col: ['#00B89C', '#8B3DFF'] as [string, string], fn: () => setSheet('theme') }] : []),
    { t: 'Share', i: 'share-social', col: ['#0EA5E9', '#3D7BFF'], fn: () => { setSheet(''); shareRoom(); } },
    { t: 'Leave room', i: 'exit', col: ['#E5484D', '#B4232A'], fn: () => { setSheet(''); leaveRoom(); } },
  ] : [];
  return room && <View style={{ flex: 1 }}>
    <LinearGradient colors={(THEMES[room.theme] || THEMES.teal).colors} start={{ x: 0, y: 0 }} end={{ x: .6, y: 1 }} style={StyleSheet.absoluteFill} />
    <View style={[s.glow, { top: 80, left: -80, backgroundColor: '#FF2E7433' }]} /><View style={[s.glow, { top: 330, right: -90, backgroundColor: '#3D7BFF33' }]} />
    <View style={[s.roomTop, { paddingTop: insets.top + 8 }]}>
      <Photo uri={room.cover || who(room.ownerId).photo} name={room.title} size={42} radius={12} />
      <View style={{ flex: 1, gap: 2 }}><Text style={s.roomTopTitle} numberOfLines={2}>{room.title}</Text><Text style={s.roomTopId}>ID {room.code || shortId(room.id).slice(0, 8)}</Text></View>
      {width >= 360 && <View style={s.onlineStack}>{(room.people || []).filter((p: Item) => !seatedIds.includes(p.id)).slice(0, 2).map((p: Item, i: number) => <View key={p.id} style={{ marginLeft: i ? -10 : 0, borderRadius: 16, borderWidth: 1.5, borderColor: '#1A0B3B' }}><Photo uri={p.photo} name={p.name} size={28} /></View>)}<View style={s.onlinePill}><Text style={s.onlinePillText}>{room.members?.length || 0}</Text></View></View>}
      <Pressable accessibilityLabel="Share room" style={s.topIcon} onPress={shareRoom}><Ionicons name="share-social-outline" size={19} color="white" /></Pressable>
      <Pressable accessibilityLabel="Minimize room" style={s.topIcon} onPress={() => navigate('')}><Ionicons name="chevron-down" size={22} color="white" /></Pressable>
      <Pressable accessibilityLabel="Leave room" style={s.topIcon} onPress={leaveRoom}><Ionicons name="power" size={20} color="white" /></Pressable>
    </View>
    <View style={s.noticeStrip}><Ionicons name="megaphone-outline" size={15} color="#FFD36A" /><Text style={s.noticeStripText}>{room.notice || room.description || 'Welcome! Be kind and have fun.'}</Text></View>
    <View style={[s.seatGrid, sheet === 'gift' && { paddingTop: 5, rowGap: 4 }]}>{(sheet === 'gift' ? (room.seats || []).slice(0, 8) : (room.seats || [])).map(seatView)}</View>
    {banner && <Animated.View style={[s.giftBanner, { transform: [{ translateX: bannerX }] }]}><LinearGradient colors={['#FF2E74F0', '#8B3DFFF0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.giftBannerInner}><Photo uri={banner.from?.photo} name={banner.from?.name} size={36} /><View style={{ flex: 1 }}><Text style={s.gbName} numberOfLines={1}>{banner.from?.name}</Text><Text style={s.gbText} numberOfLines={1}>sent {banner.giftId ? banner.giftId[0].toUpperCase() + banner.giftId.slice(1) : 'a gift'} to {banner.to?.name}</Text></View><GiftArt id={banner.giftId} size={40} /><Text style={s.gbQty}>x{banner.qty}</Text></LinearGradient></Animated.View>}
    <ScrollView ref={chatRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 10, gap: 8 }}>
      <View style={s.sysMsg}><Text style={s.sysMsgText}>Welcome to {room.title}. Respect everyone, no abuse or spam. Have fun!</Text></View>
      {roomMessages.map(m => { const joinLine = m === firstAfterJoin ? <View key="joined" style={s.sysMsg}><Text style={s.sysMsgText}>{user?.name} joined the room</Text></View> : null; const line = (() => { const p = m.fromId === user?.id ? user : (m.author?.photo !== undefined ? m.author : who(m.fromId)); return <View key={m.id} style={s.chatLine}><Pressable onPress={() => { if (m.fromId !== user?.id) openProfile(m.fromId); }}><Photo uri={p?.photo} name={p?.name} size={30} /></Pressable><View style={s.chatPill}><View style={s.row}><Level level={p?.level || 1} /><Text style={[s.chatName, (p?.vip || m.fromId === user?.id) && { color: '#FFD36A' }]}>{m.fromId === user?.id ? 'You' : p?.name}</Text>{p?.equipped?.badge && <MaterialCommunityIcons name="star-circle" size={15} color="#FFD54A" />}{(room.admins || []).includes(m.fromId) && <Text style={s.adminInline}>Admin</Text>}</View><Text style={s.chatText}>{m.text}</Text></View></View>; })(); return <React.Fragment key={m.id}>{joinLine}{line}</React.Fragment>; })}
      {!firstAfterJoin && <View style={s.sysMsg}><Text style={s.sysMsgText}>{user?.name} joined the room</Text></View>}
    </ScrollView>
    <View style={[s.roomBottom, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]}>
      <View style={s.roomInput}><TextInput accessibilityLabel="Message" placeholder="Say hi..." placeholderTextColor="#FFFFFF80" value={text} onChangeText={setText} onSubmitEditing={sendMessage} style={s.roomInputText} />{!!text.trim() && <Pressable accessibilityLabel="Send message" onPress={sendMessage}><Ionicons name="send" size={20} color="#FF7AB0" /></Pressable>}</View>
      <Pressable accessibilityLabel={micOn ? 'Mute microphone' : 'Microphone'} style={[s.roomIcon, micOn && { backgroundColor: c.teal }]} onPress={() => { if (!currentSeat) { setNotice('Bolne ke liye pehle khali seat par tap karo.'); return; } if (!audioConnected) { setNotice('Live voice ke liye server par audio service lagani hogi. Abhi text chat chalu hai.'); return; } toggleMic(); }}><Ionicons name={micOn ? 'mic' : 'mic-off'} size={22} color="white" /></Pressable>
      <Pressable accessibilityLabel="More" style={s.roomIcon} onPress={() => setSheet('more')}><Ionicons name="apps" size={21} color="white" /></Pressable>
      <Pressable accessibilityLabel="Send gift" onPress={openGifts}><LinearGradient colors={['#FFB21C', '#FF2E74']} style={s.giftFab}><MaterialCommunityIcons name="gift" size={24} color="white" /></LinearGradient></Pressable>
    </View>
    {!!notice && <View style={[s.roomToast, { bottom: insets.bottom + 80 }]}><Text style={s.roomToastText}>{notice}</Text></View>}
    {!!error && <Pressable onPress={() => setError('')} style={[s.roomToast, { bottom: insets.bottom + 80, backgroundColor: '#B4232AEE' }]}><Text style={s.roomToastText}>{error}</Text></Pressable>}
    {sheet !== '' && <Pressable style={s.scrim} onPress={() => setSheet('')} />}
    {sheet === 'more' && <View style={[s.sheet, { paddingBottom: insets.bottom + 18 }]}><View style={s.grabber} /><Text style={s.sheetTitle}>Room tools</Text><View style={s.toolGrid}>{roomTools.map(x => <Pressable key={x.t} style={s.toolItem} onPress={x.fn}><LinearGradient colors={x.col} style={s.toolIcon}><Ionicons name={x.i} size={24} color="white" /></LinearGradient><Text style={s.toolLabel}>{x.t}</Text></Pressable>)}</View></View>}
    {sheet === 'theme' && <View style={[s.sheet, { paddingBottom: insets.bottom + 18 }]}><View style={s.grabber} /><Text style={s.sheetTitle}>Room theme</Text><View style={s.toolGrid}>{Object.entries(THEMES).map(([k, t]) => <Pressable key={k} style={s.toolItem} onPress={() => { setSheet(''); act(async () => { setRoom(await api(`/rooms/${room.id}/theme`, 'POST', { theme: k })); }); }}><LinearGradient colors={t.colors} style={[s.themeSwatch, (room.theme || 'galaxy') === k && { borderColor: 'white' }]} /><Text style={s.toolLabel}>{t.name}</Text></Pressable>)}</View></View>}
    {entryShow && <Animated.View pointerEvents="none" style={[s.entryWrap, { transform: [{ translateX: entryX }] }]}><LinearGradient colors={entryShow.entrance === 'entrance-rocket' ? ['#3D7BFF', '#8B3DFF'] : entryShow.entrance === 'entrance-confetti' ? ['#FF9F1C', '#FF2E74'] : ['#FFFFFF33', '#FFFFFF14']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.entryInner}><Photo uri={entryShow.user?.photo} name={entryShow.user?.name} size={34} /><Text style={s.entryText} numberOfLines={1}>{entryShow.user?.name} joined the room</Text>{entryShow.entrance && <MaterialCommunityIcons name={entryShow.entrance === 'entrance-rocket' ? 'rocket-launch' : 'party-popper'} size={22} color="white" />}</LinearGradient></Animated.View>}
    <GiftBurst burst={burst} />
    {sheet === 'gift' && <GiftDrawer api={api} user={user!} roomId={room.id} initialRecipient={recipient} members={(room.members || []).filter((id: string) => id !== user?.id).map(who)} bottom={insets.bottom} onClose={() => setSheet('')} onWallet={openWallet} onSent={t => { setGiftEvent({ ...t, key: t.id + Date.now() }); refresh(); }} />}
    {showRoomTasks && <RoomTasks api={api} roomId={room.id} onClose={() => setShowRoomTasks(false)} onInvite={shareRoom} onRefresh={refresh} />}
    {roomProfile && <RoomProfile id={roomProfile} api={api} selfId={user!.id} hostId={room.ownerId} followed={following.includes(roomProfile)} bottom={insets.bottom} onClose={() => setRoomProfile(null)} onFollow={() => toggleFollow(roomProfile)} onGift={() => { setRecipient(roomProfile); setRoomProfile(null); setSheet('gift'); }} onFullProfile={() => { const id = roomProfile; setRoomProfile(null); openProfile(id); }} onLeave={() => { setRoomProfile(null); if (currentSeat) seatAction(currentSeat.index, 'leave'); }} onMic={() => { setRoomProfile(null); toggleMic(); }} />}
    <Modal transparent visible={!!seatMenu} animationType="fade" onRequestClose={() => setSeatMenu(null)}><View style={{ flex: 1, backgroundColor: '#0009', justifyContent: 'center', padding: 30 }}><View style={{ backgroundColor: '#242037', padding: 22, borderRadius: 20, gap: 16, maxHeight: '80%' }}><Text style={s.sheetTitle}>Seat {(seatMenu?.index ?? 0) + 1}</Text><ScrollView contentContainerStyle={{ gap: 14 }}>
      {!seatMenu?.userId && !seatMenu?.locked && <Button title={currentSeat ? 'Switch to this seat' : 'Take this seat'} onPress={() => { seatAction(seatMenu!.index, 'take'); setSeatMenu(null); }} />}
      {isMod && <Button title={seatMenu?.locked ? 'Unlock seat' : 'Lock seat'} onPress={() => { seatAction(seatMenu!.index, seatMenu?.locked ? 'unlock' : 'lock'); setSeatMenu(null); }} />}
      {isMod && !seatMenu?.userId && !seatMenu?.locked && <Button title="Invite a member" onPress={() => setInviting(!inviting)} />}
      {inviting && (room.members || []).filter((id: string) => id !== user?.id && !seatedIds.includes(id)).map((id: string) => <Button key={id} title={who(id).name} onPress={() => act(async () => { await api(`/rooms/${room.id}/seats/${seatMenu!.index}/invite`, 'POST', { userId: id }); setSeatMenu(null); setNotice('Seat invitation sent.'); })} />)}
      {inviting && !(room.members || []).some((id: string) => id !== user?.id && !seatedIds.includes(id)) && <Text style={s.sheetMuted}>No unseated members available</Text>}
      {!!seatMenu?.userId && <Button title="View profile" onPress={() => { setRoomProfile(seatMenu!.userId); setSeatMenu(null); }} />}
      {!!seatMenu?.userId && (isMod || seatMenu.userId === user?.id) && <Button title="Leave / remove from seat" onPress={() => { seatAction(seatMenu!.index, 'leave'); setSeatMenu(null); }} />}
      {!!seatMenu?.userId && isMod && <Button title={seatMenu.muted ? 'Unmute seat' : 'Mute seat'} onPress={() => { seatAction(seatMenu!.index, seatMenu.muted ? 'unmute' : 'mute'); setSeatMenu(null); }} />}
      <Button title="Close" onPress={() => setSeatMenu(null)} />
    </ScrollView></View></View></Modal>
    <Modal transparent visible={!!seatInvite} onRequestClose={() => setSeatInvite(null)}><View style={{ flex: 1, backgroundColor: '#0009', justifyContent: 'center', padding: 30 }}><View style={{ backgroundColor: '#242037', padding: 22, borderRadius: 20, gap: 16 }}><Text style={s.sheetTitle}>Seat invitation</Text><Text style={s.sheetMuted}>{seatInvite?.from?.name} invited you to seat {(seatInvite?.index ?? 0) + 1}.</Text><Button title="Accept" onPress={() => act(async () => { if (!seatInvite || seatInvite.roomId !== room.id || Date.parse(seatInvite.expiresAt) <= Date.now()) throw new Error('Invitation expired or room changed.'); await api(`/rooms/${room.id}/seats/${seatInvite!.index}`, 'POST', { action: 'take' }); setRoom(await api(`/rooms/${room.id}`)); setSeatInvite(null); })} /><Button title="Decline" onPress={() => setSeatInvite(null)} />{!!error && <Text style={s.sheetMuted}>{error}</Text>}</View></View></Modal>
  </View>;
}
