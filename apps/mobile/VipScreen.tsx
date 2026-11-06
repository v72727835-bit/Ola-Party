import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type Item = Record<string, any>;
type MIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Api = (path: string, method?: string, body?: Item) => Promise<any>;
const c = { ink: '#16112B', text: '#3A3550', muted: '#6F6A85', faint: '#9893AD', line: '#ECEAF3', brand: '#FF2E74', gold: '#FFC23C', goldDeep: '#B45309', red: '#E5484D', teal: '#00B89C' };
const shadow = Platform.select({ web: { boxShadow: '0 10px 26px rgba(40,20,90,.08)' } as any, default: { elevation: 2 } });
const benefitIcon: Record<string, MIcon> = { crown: 'crown', ring: 'circle-double', name: 'format-color-text' };
const fmt = (n: number) => n.toLocaleString('en-IN');

export default function VipScreen({ api, user, onUser, onNotice, onWallet }: { api: Api; user: Item | null; onUser: (u: Item) => void; onNotice: (t: string) => void; onWallet: () => void }) {
  const [data, setData] = useState<Item | null>(null); const [pick, setPick] = useState('vip-30'); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [confirm, setConfirm] = useState(false);
  useEffect(() => { api('/vip').then(setData).catch((e: any) => setError(e.message)); }, []);
  const until = user?.vipUntil ? new Date(user.vipUntil) : null;
  const active = !!user?.vip && (!until || until.getTime() > Date.now());
  const daysLeft = until ? Math.max(0, Math.ceil((until.getTime() - Date.now()) / 86400000)) : null;
  const plan = data?.plans?.find((p: Item) => p.id === pick);
  const coins = user?.coins ?? 0; const short = plan ? Math.max(0, plan.price - coins) : 0;
  const buy = async () => { if (!plan || busy) return; setBusy(true); setError(''); try { const r = await api(`/vip/${plan.id}/subscribe`, 'POST', {}); onUser(r.user); setConfirm(false); onNotice(`${plan.name} activated. Welcome to VIP!`); } catch (e: any) { setError(e.message); } finally { setBusy(false); } };

  return <View style={{ gap: 16 }}>
    <LinearGradient colors={['#1B1206', '#4A2A06', '#B45309']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
      <View style={st.glow} />
      <View style={st.crownWrap}><LinearGradient colors={['#FFE08A', '#FFB21C']} style={st.crown}><MaterialCommunityIcons name="crown" size={36} color="#5A3405" /></LinearGradient></View>
      <Text style={st.heroTitle}>Party VIP</Text>
      <Text style={st.heroSub}>Stand out in every room you join.</Text>
      <View style={st.status}>
        {user?.photo ? <Image source={{ uri: user.photo }} style={[st.avatar, active && st.avatarVip]} /> : <View style={[st.avatar, active && st.avatarVip, { backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="person" size={20} color="white" /></View>}
        <View style={{ flex: 1 }}>
          <Text style={[st.statusName, active && { color: '#FFD36A' }]} numberOfLines={1}>{user?.name}</Text>
          <Text style={st.statusNote}>{active ? (daysLeft !== null ? `VIP active · ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left` : 'VIP active') : 'Not a VIP yet'}</Text>
        </View>
        {active && <View style={st.activePill}><MaterialCommunityIcons name="crown" size={13} color="#5A3405" /><Text style={st.activePillText}>VIP</Text></View>}
      </View>
    </LinearGradient>

    <Text style={st.section}>What you get</Text>
    <View style={st.card}>{(data?.benefits || []).map((b: Item, i: number, all: Item[]) => <View key={b.id} style={[st.benefit, i === all.length - 1 && { borderBottomWidth: 0 }]}>
      <LinearGradient colors={['#FFE08A', '#FFB21C']} style={st.bIcon}><MaterialCommunityIcons name={benefitIcon[b.id] || 'star'} size={20} color="#5A3405" /></LinearGradient>
      <View style={{ flex: 1 }}><Text style={st.bTitle}>{b.title}</Text><Text style={st.small}>{b.desc}</Text></View>
      <Ionicons name="checkmark-circle" size={20} color={active ? c.teal : '#D9D5E6'} />
    </View>)}{!data && !error && <ActivityIndicator color={c.goldDeep} style={{ paddingVertical: 20 }} />}</View>

    <Text style={st.section}>{active ? 'Extend membership' : 'Choose a plan'}</Text>
    <View style={{ gap: 10 }}>{(data?.plans || []).map((p: Item) => { const on = pick === p.id; const perDay = Math.round(p.price / p.days); return <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => { setPick(p.id); setConfirm(false); }} style={[st.plan, on && st.planOn]}>
      <View style={[st.radio, on && st.radioOn]}>{on && <View style={st.radioDot} />}</View>
      <View style={{ flex: 1, gap: 2 }}><View style={st.inline}><Text style={st.planName}>{p.name}</Text>{p.popular && <View style={st.best}><Text style={st.bestText}>BEST VALUE</Text></View>}</View><Text style={st.small}>{p.days} days · ~{perDay} coins/day</Text></View>
      <View style={st.inline}><MaterialCommunityIcons name="circle-multiple" size={17} color={c.gold} /><Text style={st.planPrice}>{fmt(p.price)}</Text></View>
    </Pressable>; })}</View>

    {!!error && <View accessibilityRole="alert" style={st.alert}><Ionicons name="warning-outline" size={18} color={c.red} /><Text style={st.alertText}>{error}</Text></View>}

    {plan && <View style={st.summary}>
      <View style={st.rowBetween}><Text style={st.small}>Your coins</Text><Text style={st.sumVal}>{fmt(coins)}</Text></View>
      <View style={st.rowBetween}><Text style={st.small}>{plan.name}</Text><Text style={st.sumVal}>-{fmt(plan.price)}</Text></View>
      <View style={[st.rowBetween, st.sumTotal]}><Text style={st.bTitle}>{short ? 'Coins needed' : 'Balance after'}</Text><Text style={[st.sumVal, { color: short ? c.red : c.ink }]}>{short ? fmt(short) : fmt(coins - plan.price)}</Text></View>
      {active && until && <Text style={st.tiny}>New expiry: {new Date(until.getTime() + plan.days * 86400000).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>}
    </View>}

    {plan && (short ? <Pressable accessibilityRole="button" onPress={onWallet} style={st.ctaWrap}><LinearGradient colors={['#FF2E74', '#8B3DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.cta}><Ionicons name="wallet-outline" size={18} color="white" /><Text style={st.ctaText}>Get more coins</Text></LinearGradient></Pressable>
      : confirm ? <View style={{ gap: 10 }}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={buy} style={st.ctaWrap}><LinearGradient colors={['#FFB21C', '#B45309']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.cta}>{busy ? <ActivityIndicator color="white" /> : <><MaterialCommunityIcons name="crown" size={18} color="white" /><Text style={st.ctaText}>Confirm · pay {fmt(plan.price)} coins</Text></>}</LinearGradient></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setConfirm(false)}><Text style={st.cancel}>Cancel</Text></Pressable>
      </View>
      : <Pressable accessibilityRole="button" onPress={() => setConfirm(true)} style={st.ctaWrap}><LinearGradient colors={['#FFB21C', '#B45309']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.cta}><MaterialCommunityIcons name="crown" size={18} color="white" /><Text style={st.ctaText}>{active ? 'Extend VIP' : 'Become VIP'}</Text></LinearGradient></Pressable>)}
    <Text style={[st.tiny, { textAlign: 'center' }]}>Paid with in-app test coins. No automatic renewal.</Text>
  </View>;
}

const st = StyleSheet.create({
  hero: { borderRadius: 24, padding: 20, alignItems: 'center', gap: 6, overflow: 'hidden' },
  glow: { position: 'absolute', top: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: '#FFC23C33' },
  crownWrap: { padding: 4, borderRadius: 40, backgroundColor: '#FFFFFF1A' },
  crown: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFE7A3', fontSize: 28, fontWeight: '900', letterSpacing: -.4, marginTop: 6 },
  heroSub: { color: '#FCE9C5', fontSize: 14.5 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', marginTop: 12, backgroundColor: '#00000033', borderRadius: 16, padding: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#FFFFFF44' },
  avatarVip: { borderColor: '#FFC23C', borderWidth: 3 },
  statusName: { color: 'white', fontSize: 16, fontWeight: '900' },
  statusNote: { color: '#FCE9C5', fontSize: 12.5, fontWeight: '600' },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFC23C', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  activePillText: { color: '#5A3405', fontWeight: '900', fontSize: 12 },
  section: { fontSize: 18, fontWeight: '900', color: c.ink, marginTop: 4 },
  card: { backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 14, ...shadow },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line },
  bIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bTitle: { fontSize: 15.5, fontWeight: '800', color: c.ink },
  small: { color: c.muted, fontSize: 13.5, lineHeight: 19 },
  tiny: { color: c.faint, fontSize: 12 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 18, padding: 16, borderWidth: 2, borderColor: 'transparent', ...shadow },
  planOn: { borderColor: '#FFB21C', backgroundColor: '#FFFBEF' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CFCAE0', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: '#F59E0B' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#F59E0B' },
  planName: { fontSize: 16, fontWeight: '900', color: c.ink },
  planPrice: { fontSize: 17, fontWeight: '900', color: c.ink },
  best: { backgroundColor: '#FFF1D6', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7 },
  bestText: { color: c.goldDeep, fontSize: 10, fontWeight: '900', letterSpacing: .4 },
  summary: { backgroundColor: 'white', borderRadius: 18, padding: 16, gap: 8, ...shadow },
  sumVal: { fontSize: 15, fontWeight: '800', color: c.ink },
  sumTotal: { borderTopWidth: 1, borderTopColor: c.line, paddingTop: 10, marginTop: 2 },
  ctaWrap: { borderRadius: 16, overflow: 'hidden' },
  cta: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16 },
  ctaText: { color: 'white', fontWeight: '900', fontSize: 16 },
  cancel: { textAlign: 'center', color: c.muted, fontWeight: '800', paddingVertical: 6 },
  alert: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FFF1F1', borderRadius: 12, padding: 12 },
  alertText: { flex: 1, color: '#B42318', fontSize: 14, fontWeight: '600' },
});
