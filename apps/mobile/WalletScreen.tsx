import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type Item = Record<string, any>;
type MIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Api = (path: string, method?: string, body?: Item) => Promise<any>;

const c = { ink: '#16112B', text: '#3A3550', muted: '#6F6A85', faint: '#9893AD', line: '#ECEAF3', brand: '#FF2E74', violet: '#7C3AED', teal: '#00B89C', gold: '#FFC23C', red: '#E5484D', blue: '#3D7BFF' };
const shadow = Platform.select({ web: { boxShadow: '0 10px 26px rgba(40,20,90,.08)' } as any, default: { elevation: 2 } });

type Kind = { title: string; icon: MIcon; tint: [string, string]; sign: 1 | -1; currency: 'coin' | 'diamond' };
/** Turns a ledger row into a readable line from the signed-in user's point of view. */
export function describeLedger(l: Item, me?: string): Kind {
  const got = l.recipientId === me;
  switch (l.type) {
    case 'demo-credit': return { title: 'Test coins added', icon: 'flask-outline', tint: ['#00B89C', '#0EA5E9'], sign: 1, currency: 'coin' };
    case 'task-reward': return { title: 'Daily task reward', icon: 'calendar-check', tint: ['#00B89C', '#3D7BFF'], sign: 1, currency: 'coin' };
    case 'exchange': return { title: `Exchanged ${l.diamonds ?? ''} diamonds`, icon: 'swap-horizontal', tint: ['#3D7BFF', '#7C3AED'], sign: 1, currency: 'coin' };
    case 'gift': return got ? { title: `Gift received${l.giftName ? ' · ' + l.giftName : ''}`, icon: 'gift', tint: ['#FF2E74', '#8B3DFF'], sign: 1, currency: 'diamond' } : { title: `Gift sent${l.giftName ? ' · ' + l.giftName : ''}`, icon: 'gift-outline', tint: ['#FFB21C', '#FF2E74'], sign: -1, currency: 'coin' };
    case 'decoration-purchase': return { title: 'Style shop purchase', icon: 'shopping-outline', tint: ['#8B3DFF', '#C04BFF'], sign: -1, currency: 'coin' };
    case 'vip-purchase': return { title: 'VIP membership', icon: 'crown', tint: ['#FFB21C', '#B45309'], sign: -1, currency: 'coin' };
    case 'lucky-bag': return { title: 'Lucky bag sent', icon: 'sack', tint: ['#FFB21C', '#F25C05'], sign: -1, currency: 'coin' };
    case 'lucky-bag-claim': return got ? { title: 'Lucky bag grabbed', icon: 'sack-percent', tint: ['#FFB21C', '#FF2E74'], sign: 1, currency: 'coin' } : { title: 'Lucky bag share claimed', icon: 'sack', tint: ['#9893AD', '#6F6A85'], sign: -1, currency: 'coin' };
    case 'lucky-bag-refund': return { title: 'Lucky bag refund', icon: 'cash-refund', tint: ['#00B89C', '#0EA5E9'], sign: 1, currency: 'coin' };
    default: return { title: String(l.type || 'Transaction').replace(/-/g, ' '), icon: 'swap-vertical', tint: ['#9893AD', '#6F6A85'], sign: got ? 1 : -1, currency: 'coin' };
  }
}

const fmt = (n: number) => n.toLocaleString('en-IN');
const dayLabel = (iso?: string) => {
  if (!iso) return 'Earlier'; const d = new Date(iso); const today = new Date(); const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today'; if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
};
const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '');

function Currency({ kind, size = 16 }: { kind: 'coin' | 'diamond'; size?: number }) {
  return kind === 'coin' ? <MaterialCommunityIcons name="circle-multiple" size={size} color={c.gold} /> : <MaterialCommunityIcons name="diamond-stone" size={size} color="#38BDF8" />;
}

export default function WalletScreen({ api, me, demo, onBalance, onNotice }: { api: Api; me?: string; demo?: boolean; onBalance: (b: { coins: number; diamonds: number }) => void; onNotice: (t: string) => void }) {
  const [wallet, setWallet] = useState<Item | null>(null); const [packs, setPacks] = useState<Item | null>(null);
  const [tab, setTab] = useState<'Recharge' | 'Exchange' | 'History'>('Recharge'); const [filter, setFilter] = useState<'All' | 'Income' | 'Spent'>('All');
  const [pick, setPick] = useState(''); const [amount, setAmount] = useState(''); const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);

  const load = useCallback(async () => { setError(''); try { const [w, p] = await Promise.all([api('/wallet'), api('/wallet/packages')]); setWallet(w); setPacks(p); onBalance({ coins: w.coins, diamonds: w.diamonds }); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }, [api]);
  useEffect(() => { load(); }, []);
  const run = async (key: string, fn: () => Promise<void>) => { if (busy) return; setBusy(key); setError(''); try { await fn(); } catch (e: any) { setError(e.message); } finally { setBusy(''); } };

  const coins = wallet?.coins ?? 0; const diamonds = wallet?.diamonds ?? 0;
  const rate = packs?.exchange || { diamonds: 10, coins: 8 };
  const n = Number(amount) || 0; const valid = n >= rate.diamonds && n % rate.diamonds === 0 && n <= diamonds; const receive = Math.floor(n / rate.diamonds) * rate.coins;
  const amountError = !amount ? '' : n > diamonds ? 'More than your diamond balance' : n % rate.diamonds ? `Use multiples of ${rate.diamonds}` : n < rate.diamonds ? `Minimum ${rate.diamonds} diamonds` : '';

  const rows = useMemo(() => (wallet?.ledger || []).map((l: Item) => ({ l, k: describeLedger(l, me) })).filter(({ k }: Item) => filter === 'All' || (filter === 'Income' ? k.sign > 0 : k.sign < 0)), [wallet, filter, me]);
  const groups = useMemo(() => { const g: [string, Item[]][] = []; for (const r of rows) { const d = dayLabel(r.l.createdAt); const last = g[g.length - 1]; if (last && last[0] === d) last[1].push(r); else g.push([d, [r]]); } return g; }, [rows]);
  const income = (wallet?.ledger || []).reduce((a: number, l: Item) => { const k = describeLedger(l, me); return k.sign > 0 && k.currency === 'coin' ? a + (l.amount || 0) : a; }, 0);
  const spent = (wallet?.ledger || []).reduce((a: number, l: Item) => { const k = describeLedger(l, me); return k.sign < 0 && k.currency === 'coin' ? a + (l.amount || 0) : a; }, 0);

  if (loading) return <View style={{ paddingVertical: 80, alignItems: 'center' }}><ActivityIndicator color={c.brand} size="large" /></View>;

  return <View style={{ gap: 16 }}>
    <LinearGradient colors={['#2B0A55', '#7C3AED', '#FF2E74']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
      <View style={st.heroGlow} />
      <View style={st.rowBetween}><Text style={st.heroLabel}>My balance</Text>{demo !== false && <View style={st.testPill}><Ionicons name="flask" size={12} color="white" /><Text style={st.testPillText}>Test coins</Text></View>}</View>
      <View style={st.balances}>
        <View style={{ flex: 1, gap: 4 }}><View style={st.inline}><Currency kind="coin" size={26} /><Text style={st.balance}>{fmt(coins)}</Text></View><Text style={st.heroSub}>Coins · spend on gifts</Text></View>
        <View style={st.vline} />
        <View style={{ flex: 1, gap: 4 }}><View style={st.inline}><Currency kind="diamond" size={24} /><Text style={st.balance}>{fmt(diamonds)}</Text></View><Text style={st.heroSub}>Diamonds · from gifts</Text></View>
      </View>
      <View style={st.heroStats}><Text style={st.heroStat}>+{fmt(income)} earned</Text><Text style={st.heroStat}>·</Text><Text style={st.heroStat}>-{fmt(spent)} spent</Text><Text style={st.heroStat}>(last 100)</Text></View>
    </LinearGradient>

    <View style={st.segment}>{(['Recharge', 'Exchange', 'History'] as const).map(t => <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => { setTab(t); setError(''); }} style={[st.segItem, tab === t && st.segOn]}><Text style={[st.segText, tab === t && { color: c.ink }]}>{t}</Text></Pressable>)}</View>

    {!!error && <View accessibilityRole="alert" style={st.alert}><Ionicons name="warning-outline" size={18} color={c.red} /><Text style={st.alertText}>{error}</Text><Pressable onPress={load}><Text style={st.link}>Retry</Text></Pressable></View>}

    {tab === 'Recharge' && <>
      <View style={st.notice}><Ionicons name="information-circle" size={19} color={c.violet} /><Text style={st.noticeText}>{packs?.reason || 'Payments are not configured yet.'} No money will be charged.</Text></View>
      <View style={st.grid}>
        {(packs?.packages || []).map((p: Item) => { const on = pick === p.id; return <Pressable key={p.id} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${p.coins} coins for ${p.price}`} onPress={() => setPick(on ? '' : p.id)} style={[st.pack, on && st.packOn]}>
          {p.popular && <LinearGradient colors={['#FF2E74', '#8B3DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.popular}><Text style={st.popularText}>POPULAR</Text></LinearGradient>}
          <Currency kind="coin" size={30} />
          <Text style={st.packCoins}>{fmt(p.coins)}</Text>
          <Text style={[st.packBonus, !p.bonus && { color: 'transparent' }]}>+{fmt(p.bonus)} bonus</Text>
          <View style={[st.price, on && { backgroundColor: c.brand }]}><Text style={[st.priceText, on && { color: 'white' }]}>{p.price}</Text></View>
        </Pressable>; })}
      </View>
      <Pressable disabled style={[st.cta, { opacity: .5 }]} accessibilityState={{ disabled: true }}><LinearGradient colors={['#FF2E74', '#8B3DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.ctaInner}><Ionicons name="lock-closed" size={16} color="white" /><Text style={st.ctaText}>{pick ? 'Recharge unavailable in test mode' : 'Select a package'}</Text></LinearGradient></Pressable>
      {demo !== false && <View style={st.card}>
        <View style={st.inline}><View style={[st.iconBubble, { backgroundColor: '#E6FBF6' }]}><Ionicons name="flask-outline" size={20} color={c.teal} /></View><View style={{ flex: 1 }}><Text style={st.cardTitle}>Free test coins</Text><Text style={st.small}>Add up to 1,000 test coins a day to try gifts and games.</Text></View></View>
        <Pressable accessibilityRole="button" disabled={!!busy} onPress={() => run('credit', async () => { const r = await api('/wallet/demo-credit', 'POST', { amount: 100 }); const w = await api('/wallet'); setWallet(w); onBalance({ coins: w.coins, diamonds: w.diamonds }); onNotice('100 test coins added.'); void r; })} style={({ pressed }) => [st.soft, pressed && { opacity: .8 }]}>
          {busy === 'credit' ? <ActivityIndicator color={c.teal} /> : <Text style={[st.softText, { color: c.teal }]}>+ Add 100 test coins</Text>}
        </Pressable>
      </View>}
    </>}

    {tab === 'Exchange' && <View style={[st.card, { gap: 16 }]}>
      <View style={st.rate}><View style={st.inline}><Currency kind="diamond" size={22} /><Text style={st.rateText}>{rate.diamonds}</Text></View><Ionicons name="arrow-forward" size={18} color={c.faint} /><View style={st.inline}><Currency kind="coin" size={22} /><Text style={st.rateText}>{rate.coins}</Text></View></View>
      <Text style={[st.small, { textAlign: 'center', marginTop: -6 }]}>Turn diamonds you received from gifts into coins.</Text>
      <View style={{ gap: 7 }}>
        <Text style={st.label}>Diamonds to exchange</Text>
        <View style={[st.amountWrap, !!amountError && { borderColor: '#F5B5B7' }]}><Currency kind="diamond" size={20} /><TextInput accessibilityLabel="Diamonds to exchange" value={amount} onChangeText={v => setAmount(v.replace(/\D/g, '').slice(0, 7))} keyboardType="number-pad" placeholder="0" placeholderTextColor={c.faint} style={st.amountInput} /><Text style={st.small}>of {fmt(diamonds)}</Text></View>
        {!!amountError && <Text style={st.err}>{amountError}</Text>}
      </View>
      <View style={st.chips}>{[10, 100, 500].map(v => <Pressable key={v} disabled={v > diamonds} onPress={() => setAmount(String(v))} style={[st.chip, v > diamonds && { opacity: .4 }]}><Text style={st.chipText}>{v}</Text></Pressable>)}
        <Pressable disabled={diamonds < rate.diamonds} onPress={() => setAmount(String(diamonds - (diamonds % rate.diamonds)))} style={[st.chip, diamonds < rate.diamonds && { opacity: .4 }]}><Text style={st.chipText}>All</Text></Pressable></View>
      <View style={st.receive}><Text style={st.small}>You will receive</Text><View style={st.inline}><Currency kind="coin" size={20} /><Text style={st.receiveText}>{fmt(valid ? receive : 0)}</Text></View></View>
      <Pressable accessibilityRole="button" disabled={!valid || !!busy} onPress={() => run('exchange', async () => { const r = await api('/wallet/exchange', 'POST', { diamonds: n }); setAmount(''); const w = await api('/wallet'); setWallet(w); onBalance({ coins: r.coins, diamonds: r.diamonds }); onNotice(`Exchanged ${n} diamonds for ${r.received} coins.`); })} style={[st.cta, (!valid || !!busy) && { opacity: .5 }]}>
        <LinearGradient colors={['#3D7BFF', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.ctaInner}>{busy === 'exchange' ? <ActivityIndicator color="white" /> : <><Ionicons name="swap-horizontal" size={18} color="white" /><Text style={st.ctaText}>Exchange</Text></>}</LinearGradient>
      </Pressable>
      {diamonds < rate.diamonds && <Text style={[st.small, { textAlign: 'center' }]}>You need at least {rate.diamonds} diamonds. Host a room and receive gifts to earn diamonds.</Text>}
    </View>}

    {tab === 'History' && <>
      <View style={st.chips}>{(['All', 'Income', 'Spent'] as const).map(f => <Pressable key={f} accessibilityRole="button" accessibilityState={{ selected: filter === f }} onPress={() => setFilter(f)} style={[st.chip, filter === f && st.chipOn]}><Text style={[st.chipText, filter === f && { color: 'white' }]}>{f}</Text></Pressable>)}</View>
      {groups.length ? groups.map(([d, list]) => <View key={d} style={{ gap: 8 }}>
        <Text style={st.day}>{d}</Text>
        <View style={st.list}>{list.map(({ l, k }: Item, i: number) => <View key={l.id || i} style={[st.txRow, i === list.length - 1 && { borderBottomWidth: 0 }]}>
          <LinearGradient colors={k.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.txIcon}><MaterialCommunityIcons name={k.icon} size={20} color="white" /></LinearGradient>
          <View style={{ flex: 1, gap: 2 }}><Text style={st.txTitle} numberOfLines={1}>{k.title}</Text><Text style={st.tiny}>{time(l.createdAt)}{l.quantity > 1 ? ` · x${l.quantity}` : ''}</Text></View>
          <View style={st.inline}><Text style={[st.txAmount, { color: k.sign > 0 ? c.teal : c.ink }]}>{k.sign > 0 ? '+' : '-'}{fmt(l.amount || 0)}</Text><Currency kind={k.currency} size={15} /></View>
        </View>)}</View>
      </View>) : <View style={st.empty}><MaterialCommunityIcons name="receipt-text-outline" size={44} color={c.faint} /><Text style={st.cardTitle}>No transactions yet</Text><Text style={[st.small, { textAlign: 'center' }]}>{filter === 'All' ? 'Send a gift or claim a daily reward and it will show here.' : `No ${filter.toLowerCase()} entries in your last 100 transactions.`}</Text></View>}
    </>}
  </View>;
}

const st = StyleSheet.create({
  hero: { borderRadius: 24, padding: 20, gap: 16, overflow: 'hidden' },
  heroGlow: { position: 'absolute', right: -50, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFFFFF1A' },
  heroLabel: { color: '#F3E8FF', fontSize: 14, fontWeight: '700' },
  testPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF26', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  testPillText: { color: 'white', fontSize: 11.5, fontWeight: '800' },
  balances: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  balance: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: -.5 },
  heroSub: { color: '#EBDDFF', fontSize: 12.5, fontWeight: '600' },
  vline: { width: 1, alignSelf: 'stretch', backgroundColor: '#FFFFFF33' },
  heroStats: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  heroStat: { color: '#F3E8FF', fontSize: 12.5, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  segment: { flexDirection: 'row', backgroundColor: '#ECEAF3', borderRadius: 14, padding: 4 },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  segOn: { backgroundColor: 'white', ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(40,20,90,.1)' } as any, default: { elevation: 1 } }) },
  segText: { fontWeight: '800', color: c.muted, fontSize: 14.5 },
  notice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#F3EEFF', borderRadius: 14, padding: 12 },
  noticeText: { flex: 1, color: '#4C1D95', fontSize: 13.5, lineHeight: 19 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pack: { width: '31.5%', flexGrow: 1, backgroundColor: 'white', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: 'transparent', ...shadow },
  packOn: { borderColor: c.brand, backgroundColor: '#FFF5F9' },
  popular: { position: 'absolute', top: -1, right: -1, borderTopRightRadius: 16, borderBottomLeftRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  popularText: { color: 'white', fontSize: 9.5, fontWeight: '900', letterSpacing: .5 },
  packCoins: { fontSize: 19, fontWeight: '900', color: c.ink, marginTop: 4 },
  packBonus: { fontSize: 11.5, fontWeight: '800', color: c.teal },
  price: { marginTop: 6, backgroundColor: '#F4F2F9', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  priceText: { fontSize: 12.5, fontWeight: '800', color: c.text },
  cta: { borderRadius: 16, overflow: 'hidden' },
  ctaInner: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16 },
  ctaText: { color: 'white', fontWeight: '900', fontSize: 15.5 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 16, gap: 12, ...shadow },
  cardTitle: { fontSize: 16, fontWeight: '800', color: c.ink },
  small: { color: c.muted, fontSize: 13.5, lineHeight: 19 },
  tiny: { color: c.faint, fontSize: 12 },
  label: { fontSize: 13.5, fontWeight: '800', color: c.text },
  iconBubble: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  soft: { minHeight: 46, borderRadius: 14, backgroundColor: '#E6FBF6', alignItems: 'center', justifyContent: 'center' },
  softText: { fontWeight: '900', fontSize: 15 },
  rate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#F6F5FA', borderRadius: 16, paddingVertical: 14 },
  rateText: { fontSize: 22, fontWeight: '900', color: c.ink },
  amountWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F6F5FA', borderRadius: 14, borderWidth: 1.5, borderColor: '#F6F5FA', paddingHorizontal: 14, minHeight: 56 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '900', color: c.ink, ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  err: { color: c.red, fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: c.line },
  chipOn: { backgroundColor: c.ink, borderColor: c.ink },
  chipText: { fontWeight: '800', color: c.text, fontSize: 13.5 },
  receive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.line, paddingTop: 14 },
  receiveText: { fontSize: 22, fontWeight: '900', color: c.ink },
  day: { fontSize: 13, fontWeight: '800', color: c.muted, textTransform: 'uppercase', letterSpacing: .6, marginTop: 4 },
  list: { backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 14, ...shadow },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.line },
  txIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 15, fontWeight: '700', color: c.ink },
  txAmount: { fontSize: 16, fontWeight: '900' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 20 },
  alert: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FFF1F1', borderRadius: 12, padding: 12 },
  alertText: { flex: 1, color: '#B42318', fontSize: 14, fontWeight: '600' },
  link: { color: c.brand, fontWeight: '800' },
});
