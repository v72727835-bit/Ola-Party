import React from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WalletScreen from '../../WalletScreen';
import GiftDrawer from '../../GiftDrawer';
import { Item } from '../types';
import VipScreen from '../../VipScreen';
import SettingsScreen from '../../SettingsScreen';
import type { AppCtx } from '../state/context';

export function renderWallet(ctx: AppCtx) {
  const {
    api, page, setNotice, setUser, setWallet, user
  } = ctx;
  if (!(page === 'wallet')) return null;
  return <WalletScreen api={api} me={user?.id} onBalance={b => { setUser(prev => prev ? { ...prev, ...b } : prev); setWallet(prev => prev ? { ...prev, ...b } : prev); }} onNotice={setNotice} />;
}

export function renderGifts(ctx: AppCtx) {
  const {
    api, back, dm, giftFromDm, insets, openWallet, page, people, profile, recipient, refresh, setMessages,
    setNotice, user, who
  } = ctx;
  if (!(page === 'gifts')) return null;
  return <View style={{ height: 720 }}><GiftDrawer api={api} user={user!} members={recipient ? [profile?.id === recipient ? profile : giftFromDm && dm?.id === recipient ? dm : who(recipient)] : people.filter(p => p.id !== user?.id)} initialRecipient={recipient} bottom={insets.bottom} onClose={back} onWallet={openWallet} onSent={(t: Item) => { refresh(); setNotice('Gift sent.'); if (giftFromDm && dm) api(`/users/${dm.id}/messages`, 'POST', { text: `🎁 Sent ${t.giftName || 'a gift'}${t.quantity > 1 ? ' x' + t.quantity : ''}` }).then(m => setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])).catch(() => {}); }} /></View>;
}

export function renderVip(ctx: AppCtx) {
  const {
    api, openWallet, page, setNotice, setUser, user
  } = ctx;
  if (!(page === 'vip')) return null;
  return <VipScreen api={api} user={user} onUser={u => setUser(prev => prev ? { ...prev, ...u } : u)} onNotice={setNotice} onWallet={openWallet} />;
}

export function renderSettings(ctx: AppCtx) {
  const {
    api, connected, loadCatalog, openEdit, openWallet, page, refresh, setDm, setMessages, setNotice, setPage,
    setPassword, setRetry, setRoom, setTab, setToken, setUser, socket, stopAudio, user
  } = ctx;
  const signOutLocal = async (msg = '') => { await AsyncStorage.removeItem('melo-session'); socket.current?.disconnect(); setToken(''); setUser(null); setRoom(null); setDm(null); setMessages([]); setPage(''); setTab('Party'); setPassword(''); setNotice(msg); };
  if (!(page === 'settings')) return null;
  return <SettingsScreen api={api} user={user} connected={connected} onRetry={() => { setRetry(x => x + 1); refresh(); }} onEditProfile={openEdit} onWallet={openWallet} onVip={() => loadCatalog('vip')} onStyleShop={() => loadCatalog('decorations')}
    onLogout={async () => { await api('/auth/logout', 'POST', {}).catch(() => {}); await stopAudio().catch(() => {}); await signOutLocal(); }} onDeleted={async () => { await stopAudio().catch(() => {}); await signOutLocal('Your account was deleted.'); }} onNotice={setNotice} />;
}
