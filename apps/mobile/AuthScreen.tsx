import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Item = Record<string, any>;
type Icon = React.ComponentProps<typeof Ionicons>['name'];
type Api = (path: string, method?: string, body?: Item, auth?: string) => Promise<any>;
type Mode = 'signin' | 'signup' | 'forgot' | 'reset';
type Method = 'email' | 'phone';

const c = { ink: '#16112B', text: '#3A3550', muted: '#6F6A85', faint: '#9893AD', line: '#E6E3F0', field: '#F6F5FA', brand: '#FF2E74', violet: '#7C3AED', red: '#E5484D', green: '#12A150', amber: '#F59E0B' };
const brand: [string, string] = ['#FF2E74', '#8B3DFF'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function passwordStrength(p: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: c.line };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
  if (p.length < 8) score = Math.min(score, 1);
  const map = [['Too short', c.red], ['Weak', c.red], ['Okay', c.amber], ['Good', '#3D7BFF'], ['Strong', c.green]] as const;
  const s = Math.max(1, score) as 1 | 2 | 3 | 4;
  return { score: s, label: map[p.length < 8 ? 0 : s][0], color: map[p.length < 8 ? 0 : s][1] };
}

function Input({ icon, label, value, onChange, placeholder, secure, error, keyboard, autoComplete, right, onSubmit, maxLength }: {
  icon: Icon; label: string; value: string; onChange: (v: string) => void; placeholder?: string; secure?: boolean; error?: string;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'number-pad'; autoComplete?: any; right?: React.ReactNode; onSubmit?: () => void; maxLength?: number;
}) {
  const [focus, setFocus] = useState(false); const [show, setShow] = useState(false);
  return <View style={{ gap: 7 }}>
    <Text style={st.label}>{label}</Text>
    <View style={[st.inputWrap, focus && st.inputFocus, !!error && st.inputError]}>
      <Ionicons name={icon} size={19} color={error ? c.red : focus ? c.brand : c.faint} />
      {right}
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.faint}
        secureTextEntry={secure && !show} keyboardType={keyboard || 'default'} autoCapitalize={keyboard === 'email-address' || secure ? 'none' : 'words'}
        autoCorrect={false} autoComplete={autoComplete} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} onSubmitEditing={onSubmit}
        returnKeyType={onSubmit ? 'go' : 'next'} maxLength={maxLength} style={st.input} />
      {secure && <Pressable accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} hitSlop={10} onPress={() => setShow(!show)}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.muted} />
      </Pressable>}
    </View>
    {!!error && <View style={st.errRow}><Ionicons name="alert-circle" size={14} color={c.red} /><Text style={st.errText}>{error}</Text></View>}
  </View>;
}

function PrimaryButton({ title, onPress, disabled, busy, icon }: { title: string; onPress: () => void; disabled?: boolean; busy?: boolean; icon?: Icon }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled, busy: !!busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [{ opacity: disabled ? .5 : pressed ? .88 : 1, transform: [{ scale: pressed ? .985 : 1 }] }]}>
    <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.primary}>
      {busy ? <ActivityIndicator color="white" /> : <><Text style={st.primaryText}>{title}</Text>{icon && <Ionicons name={icon} size={18} color="white" />}</>}
    </LinearGradient>
  </Pressable>;
}

/** Six boxes backed by one hidden input, so paste and autofill still work. */
function CodeBoxes({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<TextInput>(null); const [focus, setFocus] = useState(false);
  return <Pressable onPress={() => ref.current?.focus()} accessibilityLabel={label} style={{ gap: 7 }}>
    <Text style={st.label}>{label}</Text>
    <View style={st.boxes}>
      {Array.from({ length: 6 }, (_, i) => <View key={i} style={[st.box, focus && i === Math.min(value.length, 5) && st.boxOn, !!value[i] && st.boxFilled]}><Text style={st.boxText}>{value[i] || ''}</Text></View>)}
    </View>
    <TextInput ref={ref} value={value} onChangeText={v => onChange(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode"
      maxLength={6} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} accessibilityLabel={label + ' input'} style={st.hiddenInput} caretHidden />
  </Pressable>;
}

function useCountdown() {
  const [left, setLeft] = useState(0);
  useEffect(() => { if (left <= 0) return; const t = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(t); }, [left]);
  return [left, setLeft] as const;
}

export default function AuthScreen({ api, onSession, demoNote, initialInfo }: { api: Api; onSession: (data: Item) => Promise<void> | void; demoNote?: string; initialInfo?: string }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('signin'); const [method, setMethod] = useState<Method>('email');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState(''); const [code, setCode] = useState(''); const [codeSent, setCodeSent] = useState(false); const [devCode, setDevCode] = useState('');
  const [agree, setAgree] = useState(false); const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [info, setInfo] = useState(initialInfo || '');
  const [resendIn, setResendIn] = useCountdown();
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }), Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' })])); loop.start(); return () => loop.stop(); }, []);

  const go = (m: Mode) => { setMode(m); setError(''); setInfo(''); setTouched(false); setCode(''); setDevCode(''); setCodeSent(false); setConfirm(''); if (m !== 'reset') setPassword(''); };
  const run = async (key: string, fn: () => Promise<void>) => { if (busy) return; setBusy(key); setError(''); try { await fn(); } catch (e: any) { setError(e.message || 'Something went wrong'); } finally { setBusy(''); } };

  const phoneFull = phone.trim().startsWith('+') ? phone.replace(/[\s-]/g, '') : '+91' + phone.replace(/\D/g, '');
  const errs = {
    name: mode === 'signup' && method === 'email' && name.trim().length < 2 ? 'Enter at least 2 characters' : '',
    email: (method === 'email' || mode === 'forgot' || mode === 'reset') && !EMAIL_RE.test(email.trim()) ? (email ? 'Enter a valid email address' : 'Email is required') : '',
    password: (mode === 'signup' || mode === 'reset') && password.length < 8 ? 'Use at least 8 characters' : mode === 'signin' && method === 'email' && !password ? 'Password is required' : '',
    confirm: (mode === 'signup' || mode === 'reset') && method === 'email' && confirm !== password ? 'Passwords do not match' : '',
    phone: method === 'phone' && (mode === 'signin' || mode === 'signup') && !/^\+?[0-9]{8,15}$/.test(phoneFull) ? 'Enter a valid mobile number' : '',
    code: (codeSent || mode === 'reset') && code.length !== 6 ? 'Enter the 6-digit code' : '',
    agree: mode === 'signup' && !agree ? 'Please accept the terms to continue' : '',
  };
  const show = (k: keyof typeof errs) => (touched ? errs[k] : '');

  const submitEmail = () => { setTouched(true); const need = mode === 'signup' ? ['name', 'email', 'password', 'confirm', 'agree'] : ['email', 'password']; if (need.some(k => errs[k as keyof typeof errs])) return;
    run('email', async () => { const data = await api(mode === 'signup' ? '/auth/register' : '/auth/login', 'POST', mode === 'signup' ? { name: name.trim(), email: email.trim(), password } : { email: email.trim(), password }); await onSession(data); }); };
  const sendOtp = () => { setTouched(true); if (errs.phone || (mode === 'signup' && errs.agree)) return;
    run('otp', async () => { const r = await api('/auth/otp/request', 'POST', { phone: phoneFull }); setCodeSent(true); setCode(''); setTouched(false); setResendIn(30); setDevCode(r.devCode || ''); setInfo(`Code sent to ${phoneFull}`); }); };
  const verifyOtp = () => { setTouched(true); if (errs.code) return;
    run('verify', async () => { const data = await api('/auth/otp/verify', 'POST', { phone: phoneFull, code, ...(mode === 'signup' && name.trim().length >= 2 ? { name: name.trim() } : {}) }); await onSession(data); }); };
  const requestReset = () => { setTouched(true); if (errs.email) return;
    run('forgot', async () => { const r = await api('/auth/password/request', 'POST', { email: email.trim() }); setMode('reset'); setTouched(false); setCode(''); setPassword(''); setConfirm(''); setResendIn(30); setDevCode(r.devCode || ''); setInfo(`If an account exists for ${email.trim()}, a 6-digit code is on its way.`); }); };
  const resend = () => run('forgot', async () => { const r = await api('/auth/password/request', 'POST', { email: email.trim() }); setResendIn(30); setDevCode(r.devCode || ''); setInfo('A new code was sent.'); });
  const doReset = () => { setTouched(true); if (errs.code || errs.password || errs.confirm) return;
    run('reset', async () => { const data = await api('/auth/password/reset', 'POST', { email: email.trim(), code, newPassword: password }); await onSession(data); }); };
  const guest = () => run('guest', async () => { await onSession(await api('/auth/demo', 'POST', {})); });

  const strength = passwordStrength(password);
  const y = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const isAuth = mode === 'signin' || mode === 'signup';
  const title = mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Forgot password?' : 'Set a new password';
  const subtitle = mode === 'signin' ? 'Sign in to jump back into the conversation.' : mode === 'signup' ? 'It takes less than a minute.' : mode === 'forgot' ? 'Enter your account email and we will send you a 6-digit code.' : 'Enter the code from your email and choose a new password.';

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled" style={{ backgroundColor: '#F5F4F9' }}>
      <LinearGradient colors={['#1A0B3B', '#4C1D95', '#C2185B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.hero, { paddingTop: insets.top + 30 }]}>
        <View style={[st.blob, { top: -60, right: -50, backgroundColor: '#FF2E7455' }]} />
        <View style={[st.blob, { bottom: -40, left: -70, width: 200, height: 200, backgroundColor: '#8B3DFF55' }]} />
        {!isAuth && <Pressable accessibilityRole="button" accessibilityLabel="Back to sign in" onPress={() => go('signin')} style={[st.heroBack, { top: insets.top + 14 }]}><Ionicons name="chevron-back" size={22} color="white" /></Pressable>}
        <Animated.View style={{ transform: [{ translateY: y }] }}>
          <LinearGradient colors={brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.logo}><Ionicons name={isAuth ? 'mic' : 'key'} size={36} color="white" /></LinearGradient>
        </Animated.View>
        <Text style={st.wordmark}>Party App</Text>
        <Text style={st.tagline}>Live voice rooms · Real people · Good vibes</Text>
        {isAuth && <View style={st.statsRow}>
          {[['mic-outline', 'Voice rooms'], ['gift-outline', 'Gifts'], ['game-controller-outline', 'Games']].map(([i, t]) => <View key={t} style={st.stat}><Ionicons name={i as Icon} size={15} color="#FFD6E6" /><Text style={st.statText}>{t}</Text></View>)}
        </View>}
      </LinearGradient>

      <View style={st.card}>
        {isAuth && <View style={st.segment} accessibilityRole="tablist">
          {(['signin', 'signup'] as const).map(m => <Pressable key={m} accessibilityRole="tab" accessibilityState={{ selected: mode === m }} onPress={() => go(m)} style={[st.segItem, mode === m && st.segOn]}>
            <Text style={[st.segText, mode === m && st.segTextOn]}>{m === 'signin' ? 'Sign in' : 'Sign up'}</Text>
          </Pressable>)}
        </View>}

        <View style={{ gap: 4 }}>
          <Text style={st.title}>{title}</Text>
          <Text style={st.subtitle}>{subtitle}</Text>
        </View>

        {isAuth && <View style={st.methods}>
          {(['email', 'phone'] as const).map(m => <Pressable key={m} accessibilityRole="button" accessibilityState={{ selected: method === m }} onPress={() => { setMethod(m); setError(''); setInfo(''); setTouched(false); setCodeSent(false); setCode(''); }} style={[st.method, method === m && st.methodOn]}>
            <Ionicons name={m === 'email' ? 'mail-outline' : 'phone-portrait-outline'} size={16} color={method === m ? c.brand : c.muted} />
            <Text style={[st.methodText, method === m && { color: c.brand }]}>{m === 'email' ? 'Email' : 'Phone'}</Text>
          </Pressable>)}
        </View>}

        {!!info && <View style={st.info}><Ionicons name="checkmark-circle" size={18} color={c.green} /><Text style={st.infoText}>{info}</Text></View>}
        {!!devCode && <View style={st.dev}><Ionicons name="flask-outline" size={17} color={c.violet} /><Text style={st.devText}>Test mode code: <Text style={{ fontWeight: '900', letterSpacing: 2 }}>{devCode}</Text></Text>
          <Pressable accessibilityRole="button" onPress={() => setCode(devCode)}><Text style={st.devUse}>Use</Text></Pressable></View>}

        {/* ---- Email sign in / sign up ---- */}
        {isAuth && method === 'email' && <>
          {mode === 'signup' && <Input icon="person-outline" label="Your name" value={name} onChange={setName} placeholder="What should people call you?" autoComplete="name" error={show('name')} maxLength={40} />}
          <Input icon="mail-outline" label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoComplete="email" error={show('email')} />
          <Input icon="lock-closed-outline" label="Password" value={password} onChange={setPassword} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} secure autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} error={show('password')} onSubmit={mode === 'signin' ? submitEmail : undefined} />
          {mode === 'signup' && !!password && <View style={{ gap: 6 }}>
            <View style={st.meter}>{[1, 2, 3, 4].map(i => <View key={i} style={[st.meterBar, { backgroundColor: i <= strength.score ? strength.color : c.line }]} />)}</View>
            <Text style={[st.hint, { color: strength.color }]}>{strength.label}{strength.score < 3 && password.length >= 8 ? ' · add capitals, numbers or symbols' : ''}</Text>
          </View>}
          {mode === 'signup' && <Input icon="shield-checkmark-outline" label="Confirm password" value={confirm} onChange={setConfirm} placeholder="Type it again" secure autoComplete="new-password" error={show('confirm')} onSubmit={submitEmail} />}
          {mode === 'signin' && <Pressable accessibilityRole="link" onPress={() => go('forgot')} style={{ alignSelf: 'flex-end' }}><Text style={st.link}>Forgot password?</Text></Pressable>}
        </>}

        {/* ---- Phone OTP ---- */}
        {isAuth && method === 'phone' && <>
          {mode === 'signup' && <Input icon="person-outline" label="Your name (optional)" value={name} onChange={setName} placeholder="What should people call you?" maxLength={40} />}
          <Input icon="call-outline" label="Mobile number" value={phone} onChange={v => { setPhone(v); if (codeSent) { setCodeSent(false); setCode(''); setDevCode(''); setInfo(''); } }} placeholder="98765 43210" keyboard="phone-pad" autoComplete="tel"
            right={!phone.trim().startsWith('+') ? <Text style={st.prefix}>+91</Text> : undefined} error={show('phone')} />
          {codeSent && <>
            <CodeBoxes label="6-digit code" value={code} onChange={setCode} />
            {!!show('code') && <View style={st.errRow}><Ionicons name="alert-circle" size={14} color={c.red} /><Text style={st.errText}>{errs.code}</Text></View>}
            <View style={[st.rowBetween]}>
              <Text style={st.hint}>Didn't get it?</Text>
              {resendIn > 0 ? <Text style={st.hint}>Resend in 0:{String(resendIn).padStart(2, '0')}</Text> : <Pressable accessibilityRole="button" onPress={sendOtp}><Text style={st.link}>Resend code</Text></Pressable>}
            </View>
          </>}
        </>}

        {/* ---- Forgot / reset ---- */}
        {mode === 'forgot' && <Input icon="mail-outline" label="Account email" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" autoComplete="email" error={show('email')} onSubmit={requestReset} />}
        {mode === 'reset' && <>
          <View style={st.emailChip}><Ionicons name="mail" size={15} color={c.violet} /><Text style={st.emailChipText} numberOfLines={1}>{email.trim()}</Text><Pressable onPress={() => go('forgot')}><Text style={st.link}>Change</Text></Pressable></View>
          <CodeBoxes label="6-digit code" value={code} onChange={setCode} />
          {!!show('code') && <View style={st.errRow}><Ionicons name="alert-circle" size={14} color={c.red} /><Text style={st.errText}>{errs.code}</Text></View>}
          <Input icon="lock-closed-outline" label="New password" value={password} onChange={setPassword} placeholder="At least 8 characters" secure autoComplete="new-password" error={show('password')} />
          {!!password && <View style={st.meter}>{[1, 2, 3, 4].map(i => <View key={i} style={[st.meterBar, { backgroundColor: i <= strength.score ? strength.color : c.line }]} />)}</View>}
          <Input icon="shield-checkmark-outline" label="Confirm new password" value={confirm} onChange={setConfirm} placeholder="Type it again" secure autoComplete="new-password" error={show('confirm')} onSubmit={doReset} />
          <View style={st.rowBetween}><Text style={st.hint}>Code valid for 15 minutes</Text>
            {resendIn > 0 ? <Text style={st.hint}>Resend in 0:{String(resendIn).padStart(2, '0')}</Text> : <Pressable accessibilityRole="button" onPress={resend}><Text style={st.link}>Resend code</Text></Pressable>}</View>
        </>}

        {mode === 'signup' && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agree }} onPress={() => setAgree(!agree)} style={st.agree}>
          <View style={[st.check, agree && st.checkOn]}>{agree && <Ionicons name="checkmark" size={14} color="white" />}</View>
          <Text style={st.agreeText}>I am 18 or older and agree to the <Text style={{ fontWeight: '800', color: c.ink }}>Terms of Service</Text> and <Text style={{ fontWeight: '800', color: c.ink }}>Community Guidelines</Text>.</Text>
        </Pressable>}
        {!!show('agree') && <View style={st.errRow}><Ionicons name="alert-circle" size={14} color={c.red} /><Text style={st.errText}>{errs.agree}</Text></View>}

        {!!error && <View accessibilityRole="alert" style={st.alert}><Ionicons name="warning-outline" size={18} color={c.red} /><Text style={st.alertText}>{error}</Text></View>}

        {isAuth && method === 'email' && <PrimaryButton title={mode === 'signup' ? 'Create account' : 'Sign in'} icon="arrow-forward" busy={busy === 'email'} onPress={submitEmail} />}
        {isAuth && method === 'phone' && (!codeSent ? <PrimaryButton title="Send code" icon="paper-plane-outline" busy={busy === 'otp'} onPress={sendOtp} /> : <PrimaryButton title={mode === 'signup' ? 'Verify & create account' : 'Verify & sign in'} icon="checkmark" busy={busy === 'verify'} onPress={verifyOtp} />)}
        {mode === 'forgot' && <PrimaryButton title="Send reset code" icon="paper-plane-outline" busy={busy === 'forgot'} onPress={requestReset} />}
        {mode === 'reset' && <PrimaryButton title="Reset password & sign in" icon="checkmark" busy={busy === 'reset'} onPress={doReset} />}

        {isAuth && <>
          <View style={st.or}><View style={st.orLine} /><Text style={st.orText}>or</Text><View style={st.orLine} /></View>
          <Pressable accessibilityRole="button" disabled={!!busy} onPress={guest} style={({ pressed }) => [st.guest, pressed && { backgroundColor: '#FFDCE9' }]}>
            {busy === 'guest' ? <ActivityIndicator color={c.brand} /> : <><Ionicons name="sparkles-outline" size={18} color={c.brand} /><Text style={st.guestText}>Continue as guest</Text></>}
          </Pressable>
          <Text style={st.fine}>{demoNote || 'Guest accounts get 500 test coins. No real money is used.'}</Text>
          <Pressable onPress={() => go(mode === 'signin' ? 'signup' : 'signin')}><Text style={st.switch}>{mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}<Text style={st.linkInline}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</Text></Text></Pressable>
        </>}
        {!isAuth && <Pressable onPress={() => go('signin')}><Text style={st.switch}>Remembered it? <Text style={st.linkInline}>Back to sign in</Text></Text></Pressable>}
      </View>
      <View style={st.trust}><Ionicons name="lock-closed" size={13} color={c.faint} /><Text style={st.trustText}>Passwords are hashed with scrypt. Sessions expire after 7 days.</Text></View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const shadow = Platform.select({ web: { boxShadow: '0 18px 40px rgba(40,20,90,.14)' } as any, default: { elevation: 6, shadowColor: '#2A1460', shadowOpacity: .14, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } } });
const st = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingBottom: 72, alignItems: 'center', overflow: 'hidden' },
  heroBack: { position: 'absolute', left: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' },
  blob: { position: 'absolute', width: 240, height: 240, borderRadius: 140 },
  logo: { width: 78, height: 78, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF55' },
  wordmark: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: -.6, marginTop: 14 },
  tagline: { color: '#F3E8FF', fontSize: 14.5, marginTop: 4, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFFFFF1C', borderWidth: 1, borderColor: '#FFFFFF2A' },
  statText: { color: 'white', fontSize: 12.5, fontWeight: '700' },
  card: { marginHorizontal: 16, marginTop: -48, backgroundColor: 'white', borderRadius: 26, padding: 20, gap: 16, ...shadow },
  segment: { flexDirection: 'row', backgroundColor: '#F1EFF7', borderRadius: 14, padding: 4 },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  segOn: { backgroundColor: 'white', ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(40,20,90,.12)' } as any, default: { elevation: 2 } }) },
  segText: { fontSize: 15, fontWeight: '800', color: c.muted },
  segTextOn: { color: c.ink },
  title: { fontSize: 23, fontWeight: '900', color: c.ink, letterSpacing: -.3 },
  subtitle: { fontSize: 14.5, color: c.muted, lineHeight: 20 },
  methods: { flexDirection: 'row', gap: 10 },
  method: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: c.line },
  methodOn: { borderColor: c.brand, backgroundColor: '#FFF0F5' },
  methodText: { fontWeight: '800', color: c.muted, fontSize: 14 },
  label: { fontSize: 13.5, fontWeight: '800', color: c.text },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.field, borderRadius: 14, borderWidth: 1.5, borderColor: c.field, paddingHorizontal: 14, minHeight: 52 },
  inputFocus: { borderColor: c.brand, backgroundColor: 'white' },
  inputError: { borderColor: '#F5B5B7', backgroundColor: '#FFF7F7' },
  input: { flex: 1, fontSize: 16, color: c.ink, paddingVertical: 12, ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  prefix: { fontSize: 16, fontWeight: '800', color: c.text, paddingRight: 8, borderRightWidth: 1, borderRightColor: c.line },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  errText: { color: c.red, fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 13, color: c.muted, fontWeight: '600' },
  meter: { flexDirection: 'row', gap: 6 },
  meterBar: { flex: 1, height: 5, borderRadius: 3 },
  link: { color: c.brand, fontWeight: '800', fontSize: 14 },
  linkInline: { color: c.brand, fontWeight: '800' },
  primary: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryText: { color: 'white', fontSize: 16.5, fontWeight: '900' },
  boxes: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  box: { flex: 1, maxWidth: 52, height: 56, borderRadius: 14, backgroundColor: c.field, borderWidth: 1.5, borderColor: c.field, alignItems: 'center', justifyContent: 'center' },
  boxOn: { borderColor: c.brand, backgroundColor: 'white' },
  boxFilled: { borderColor: '#E3D7FF', backgroundColor: 'white' },
  boxText: { fontSize: 22, fontWeight: '900', color: c.ink },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#ECFDF3', borderRadius: 12, padding: 12 },
  infoText: { flex: 1, color: '#0F6B39', fontSize: 13.5, fontWeight: '600', lineHeight: 19 },
  dev: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#F3EEFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E3D7FF', borderStyle: 'dashed' },
  devText: { flex: 1, color: '#4C1D95', fontSize: 13.5 },
  devUse: { color: c.violet, fontWeight: '900' },
  emailChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F6F3FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  emailChipText: { flex: 1, color: c.ink, fontWeight: '700' },
  agree: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#CFCAE0', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkOn: { backgroundColor: c.brand, borderColor: c.brand },
  agreeText: { flex: 1, color: c.text, fontSize: 13.5, lineHeight: 19 },
  alert: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#FFF1F1', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FBD5D6' },
  alertText: { flex: 1, color: '#B42318', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: c.line },
  orText: { color: c.faint, fontWeight: '700', fontSize: 13 },
  guest: { minHeight: 52, borderRadius: 16, backgroundColor: '#FFEAF2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  guestText: { color: c.brand, fontWeight: '900', fontSize: 16 },
  fine: { textAlign: 'center', color: c.faint, fontSize: 12.5, marginTop: -6 },
  switch: { textAlign: 'center', color: c.muted, fontSize: 14.5, fontWeight: '600' },
  trust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, paddingHorizontal: 24 },
  trustText: { color: c.faint, fontSize: 12, textAlign: 'center' },
});
