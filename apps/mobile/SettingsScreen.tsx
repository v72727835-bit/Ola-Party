import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Item = Record<string, any>;
type Icon = React.ComponentProps<typeof Ionicons>['name'];
type Api = (path: string, method?: string, body?: Item) => Promise<any>;
const c = { ink: '#16112B', text: '#3A3550', muted: '#6F6A85', faint: '#9893AD', line: '#ECEAF3', field: '#F6F5FA', brand: '#FF2E74', violet: '#7C3AED', teal: '#00B89C', red: '#E5484D', blue: '#3D7BFF', mango: '#FF9F1C', gold: '#FFC23C' };
const shadow = Platform.select({ web: { boxShadow: '0 10px 26px rgba(40,20,90,.07)' } as any, default: { elevation: 1 } });

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return <View style={{ gap: 8 }}><Text style={st.section}>{title}</Text><View style={st.card}>{children}</View>{!!note && <Text style={st.note}>{note}</Text>}</View>;
}
function Row({ icon, tint, title, sub, onPress, right, last, danger }: { icon: Icon; tint: string; title: string; sub?: string; onPress?: () => void; right?: React.ReactNode; last?: boolean; danger?: boolean }) {
  const body = <><View style={[st.icon, { backgroundColor: tint + '1F' }]}><Ionicons name={icon} size={18} color={tint} /></View>
    <View style={{ flex: 1, gap: 1 }}><Text style={[st.rowTitle, danger && { color: c.red }]}>{title}</Text>{!!sub && <Text style={st.rowSub}>{sub}</Text>}</View>
    {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={c.faint} /> : null)}</>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [st.row, last && { borderBottomWidth: 0 }, pressed && { backgroundColor: '#FAF9FD' }]}>{body}</Pressable> : <View style={[st.row, last && { borderBottomWidth: 0 }]}>{body}</View>;
}
function Toggle({ value, onChange, label, disabled }: { value: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <Switch accessibilityLabel={label} value={value} disabled={disabled} onValueChange={onChange} trackColor={{ false: '#DAD6E6', true: '#FF8FB5' }} thumbColor={value ? c.brand : '#FFFFFF'} {...(Platform.OS === 'web' ? { activeThumbColor: c.brand } as any : {})} />;
}
function PwInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return <View style={{ gap: 6 }}><Text style={st.label}>{label}</Text><View style={st.inputWrap}><Ionicons name="lock-closed-outline" size={18} color={c.faint} />
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} secureTextEntry={!show} autoCapitalize="none" autoCorrect={false} style={st.input} placeholderTextColor={c.faint} />
    <Pressable accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow(!show)} hitSlop={10}><Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={19} color={c.muted} /></Pressable></View></View>;
}

export default function SettingsScreen({ api, user, connected, onRetry, onEditProfile, onWallet, onVip, onStyleShop, onBlocked, onLogout, onDeleted, onNotice }: {
  api: Api; user: Item | null; connected: boolean; onRetry: () => void; onEditProfile: () => void; onWallet: () => void; onVip: () => void; onStyleShop: () => void; onBlocked?: () => void;
  onLogout: () => Promise<void>; onDeleted: () => Promise<void>; onNotice: (t: string) => void;
}) {
  const [prefs, setPrefs] = useState<Item | null>(null); const [saving, setSaving] = useState(''); const [error, setError] = useState('');
  const [pwOpen, setPwOpen] = useState(false); const [cur, setCur] = useState(''); const [next, setNext] = useState(''); const [again, setAgain] = useState(''); const [pwBusy, setPwBusy] = useState(false); const [pwErr, setPwErr] = useState('');
  const [exporting, setExporting] = useState(false); const [exported, setExported] = useState<Item | null>(null);
  const [delOpen, setDelOpen] = useState(false); const [delPw, setDelPw] = useState(''); const [delText, setDelText] = useState(''); const [delBusy, setDelBusy] = useState(false); const [delErr, setDelErr] = useState('');
  const [outBusy, setOutBusy] = useState(false);
  useEffect(() => { api('/me/settings').then(setPrefs).catch((e: any) => setError(e.message)); }, []);

  const set = async (group: 'privacy' | 'notify', key: string, value: boolean) => {
    const before = prefs; setPrefs((p: Item | null) => p ? { ...p, [group]: { ...p[group], [key]: value } } : p); setSaving(group + key); setError('');
    try { setPrefs(await api('/me/settings', 'PATCH', { [group]: { [key]: value } })); } catch (e: any) { setPrefs(before); setError(e.message); } finally { setSaving(''); }
  };
  const phoneUser = String(user?.email || '').endsWith('@phone.invalid'); const guest = !!user?.demo;
  const loginLabel = phoneUser ? String(user?.email).replace('phone-', '+').replace('@phone.invalid', '') : guest ? 'Guest account' : user?.email;
  const pwProblem = !cur ? 'Enter your current password' : next.length < 8 ? 'New password needs at least 8 characters' : next === cur ? 'Choose a different password' : next !== again ? 'New passwords do not match' : '';
  const changePw = async () => { if (pwProblem) { setPwErr(pwProblem); return; } setPwBusy(true); setPwErr(''); try { await api('/me/password', 'POST', { currentPassword: cur, newPassword: next }); setCur(''); setNext(''); setAgain(''); setPwOpen(false); onNotice('Password changed. Other devices were signed out.'); } catch (e: any) { setPwErr(e.message); } finally { setPwBusy(false); } };
  const exportData = async () => { setExporting(true); try { const d = await api('/me/export'); setExported({ messages: d.messages.length, posts: d.posts.length, comments: d.comments.length, ledger: d.ledger.length, at: d.exportedAt }); } catch (e: any) { setError(e.message); } finally { setExporting(false); } };
  const canDelete = delText.trim().toUpperCase() === 'DELETE' && (guest || !!delPw);
  const del = async () => { if (!canDelete) return; setDelBusy(true); setDelErr(''); try { await api('/me', 'DELETE', guest ? {} : { password: delPw }); await onDeleted(); } catch (e: any) { setDelErr(e.message); setDelBusy(false); } };

  const p = prefs?.privacy || {}; const n = prefs?.notify || {};
  return <View style={{ gap: 18 }}>
    <Pressable accessibilityRole="button" onPress={onEditProfile} style={({ pressed }) => [pressed && { opacity: .92 }]}>
      <LinearGradient colors={['#FF2E74', '#8B3DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.profile}>
        {user?.photo ? <Image source={{ uri: user.photo }} style={st.avatar} /> : <View style={[st.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF33' }]}><Text style={st.avatarText}>{(user?.name || 'P').slice(0, 1).toUpperCase()}</Text></View>}
        <View style={{ flex: 1, gap: 2 }}><Text style={st.pName} numberOfLines={1}>{user?.name}</Text><Text style={st.pSub} numberOfLines={1}>{loginLabel}</Text></View>
        <View style={st.editPill}><Ionicons name="create-outline" size={14} color="white" /><Text style={st.editText}>Edit</Text></View>
      </LinearGradient>
    </Pressable>

    {!!error && <View accessibilityRole="alert" style={st.alert}><Ionicons name="warning-outline" size={18} color={c.red} /><Text style={st.alertText}>{error}</Text></View>}

    <Section title="Account">
      <Row icon="wallet-outline" tint={c.mango} title="Wallet" sub={`${(user?.coins ?? 0).toLocaleString('en-IN')} coins · ${(user?.diamonds ?? 0).toLocaleString('en-IN')} diamonds`} onPress={onWallet} />
      <Row icon="diamond-outline" tint="#B45309" title="VIP membership" sub={user?.vip ? 'Active' : 'Not active'} onPress={onVip} />
      <Row icon="color-palette-outline" tint={c.violet} title="Style shop" sub="Frames, entrances and badges" onPress={onStyleShop} last={!onBlocked} />
      {onBlocked && <Row icon="ban-outline" tint={c.red} title="Blocked people" onPress={onBlocked} last />}
    </Section>

    <Section title="Privacy" note="Turning off messages from strangers still lets people you follow, and people you already talk to, reach you.">
      <Row icon="chatbubbles-outline" tint={c.blue} title="Messages from strangers" sub="Anyone can start a chat with you" right={prefs ? <Toggle label="Messages from strangers" value={!!p.dmFromStrangers} disabled={saving === 'privacydmFromStrangers'} onChange={v => set('privacy', 'dmFromStrangers', v)} /> : <ActivityIndicator color={c.brand} />} />
      <Row icon="footsteps-outline" tint={c.teal} title="Leave visit footprints" sub="Show up in Visitors when you open a profile" right={prefs ? <Toggle label="Leave visit footprints" value={!!p.showVisits} disabled={saving === 'privacyshowVisits'} onChange={v => set('privacy', 'showVisits', v)} /> : <ActivityIndicator color={c.brand} />} last />
    </Section>

    <Section title="Pop-up alerts" note="Everything still appears in your Notifications list. These switches only control the live pop-ups.">
      {([['follows', 'person-add-outline', c.brand, 'New followers'], ['gifts', 'gift-outline', c.mango, 'Gifts received'], ['comments', 'chatbox-ellipses-outline', c.blue, 'Comments on my posts'], ['rooms', 'mic-outline', c.violet, 'Room invites & admin roles']] as const).map(([k, i, t, label], idx) =>
        <Row key={k} icon={i} tint={t} title={label} right={prefs ? <Toggle label={label} value={!!n[k]} disabled={saving === 'notify' + k} onChange={v => set('notify', k, v)} /> : <ActivityIndicator color={c.brand} />} last={idx === 3} />)}
    </Section>

    <Section title="Security">
      {guest || phoneUser ? <Row icon="key-outline" tint={c.muted} title="Password" sub={guest ? 'Guest accounts sign in without a password' : 'You sign in with a one-time code sent to your phone'} last />
        : <>
          <Row icon="key-outline" tint={c.violet} title="Change password" sub="Signs out your other devices" onPress={() => { setPwOpen(!pwOpen); setPwErr(''); }} right={<Ionicons name={pwOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.faint} />} last={!pwOpen} />
          {pwOpen && <View style={st.expand}>
            <PwInput label="Current password" value={cur} onChange={setCur} />
            <PwInput label="New password" value={next} onChange={setNext} />
            <PwInput label="Confirm new password" value={again} onChange={setAgain} />
            {!!pwErr && <Text style={st.err}>{pwErr}</Text>}
            <Pressable accessibilityRole="button" disabled={pwBusy} onPress={changePw} style={st.btnWrap}><LinearGradient colors={['#FF2E74', '#8B3DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.btn}>{pwBusy ? <ActivityIndicator color="white" /> : <Text style={st.btnText}>Update password</Text>}</LinearGradient></Pressable>
          </View>}
        </>}
    </Section>

    <Section title="Your data">
      <Row icon="download-outline" tint={c.teal} title="Download my data" sub={exported ? `Ready: ${exported.messages} messages, ${exported.posts} posts, ${exported.comments} comments, ${exported.ledger} wallet records` : 'Profile, messages, posts and wallet history'} onPress={exporting ? undefined : exportData} right={exporting ? <ActivityIndicator color={c.teal} /> : exported ? <Ionicons name="checkmark-circle" size={20} color={c.teal} /> : undefined} />
      <Row icon="trash-outline" tint={c.red} title="Delete account" sub="Permanently removes your profile" danger onPress={() => { setDelOpen(!delOpen); setDelErr(''); }} right={<Ionicons name={delOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.faint} />} last={!delOpen} />
      {delOpen && <View style={[st.expand, { backgroundColor: '#FFF7F7' }]}>
        <Text style={st.warn}>This cannot be undone. Your name, photo, bio, followers and sessions are removed. Wallet records are kept for financial history.</Text>
        {!guest && <PwInput label="Your password" value={delPw} onChange={setDelPw} />}
        <View style={{ gap: 6 }}><Text style={st.label}>Type DELETE to confirm</Text><View style={st.inputWrap}><TextInput accessibilityLabel="Type DELETE to confirm" value={delText} onChangeText={setDelText} autoCapitalize="characters" style={st.input} placeholder="DELETE" placeholderTextColor={c.faint} /></View></View>
        {!!delErr && <Text style={st.err}>{delErr}</Text>}
        <Pressable accessibilityRole="button" disabled={!canDelete || delBusy} onPress={del} style={[st.dangerBtn, (!canDelete || delBusy) && { opacity: .45 }]}>{delBusy ? <ActivityIndicator color="white" /> : <Text style={st.btnText}>Delete my account</Text>}</Pressable>
      </View>}
    </Section>

    <Section title="App">
      <Row icon={connected ? 'cloud-done-outline' : 'cloud-offline-outline'} tint={connected ? c.teal : c.red} title="Live connection" sub={connected ? 'Connected — chat and gifts update instantly' : 'Offline — tap retry to reconnect'} right={<Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}><Text style={st.link}>Retry</Text></Pressable>} />
      <Row icon="shield-checkmark-outline" tint={c.violet} title="Safety tip" sub="Never share passwords or personal details. Block or report anyone who bothers you from their profile." />
      <Row icon="information-circle-outline" tint={c.muted} title="Version" sub="Party App 0.3.0" last />
    </Section>

    <Pressable accessibilityRole="button" disabled={outBusy} onPress={async () => { setOutBusy(true); try { await onLogout(); } finally { setOutBusy(false); } }} style={({ pressed }) => [st.logout, pressed && { backgroundColor: '#FFDCE9' }]}>
      {outBusy ? <ActivityIndicator color={c.brand} /> : <><Ionicons name="log-out-outline" size={19} color={c.brand} /><Text style={st.logoutText}>Log out</Text></>}
    </Pressable>
  </View>;
}

const st = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 16 },
  avatar: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: '#FFFFFF66' },
  avatarText: { color: 'white', fontSize: 22, fontWeight: '900' },
  pName: { color: 'white', fontSize: 18, fontWeight: '900' },
  pSub: { color: '#FBE3F0', fontSize: 13, fontWeight: '600' },
  editPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF2E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  editText: { color: 'white', fontWeight: '800', fontSize: 13 },
  section: { fontSize: 13, fontWeight: '800', color: c.muted, textTransform: 'uppercase', letterSpacing: .6, marginLeft: 4 },
  note: { fontSize: 12.5, color: c.faint, lineHeight: 18, marginHorizontal: 4 },
  card: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.line, minHeight: 60 },
  icon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15.5, fontWeight: '700', color: c.ink },
  rowSub: { fontSize: 12.5, color: c.muted, lineHeight: 17 },
  expand: { padding: 14, gap: 12, backgroundColor: '#FBFAFE', borderBottomWidth: 0 },
  label: { fontSize: 13, fontWeight: '800', color: c.text },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', borderRadius: 12, borderWidth: 1.5, borderColor: c.line, paddingHorizontal: 12, minHeight: 48 },
  input: { flex: 1, fontSize: 15.5, color: c.ink, paddingVertical: 10, ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  err: { color: c.red, fontSize: 13, fontWeight: '600' },
  warn: { color: '#912018', fontSize: 13.5, lineHeight: 19 },
  btnWrap: { borderRadius: 14, overflow: 'hidden' },
  btn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  btnText: { color: 'white', fontWeight: '900', fontSize: 15 },
  dangerBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: c.red },
  link: { color: c.brand, fontWeight: '800' },
  logout: { minHeight: 52, borderRadius: 16, backgroundColor: '#FFEAF2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: c.brand, fontWeight: '900', fontSize: 16 },
  alert: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FFF1F1', borderRadius: 12, padding: 12 },
  alertText: { flex: 1, color: '#B42318', fontSize: 14, fontWeight: '600' },
});
