// Account recovery, user preferences, wallet packages and diamond exchange.
import { randomInt } from 'node:crypto';
import { z } from 'zod';

type Row = Record<string, any>;

export const DEFAULT_SETTINGS = {
  privacy: { dmFromStrangers: true, showVisits: true },
  notify: { follows: true, gifts: true, comments: true, rooms: true },
};

/** Test-mode coin packages. Shown for planning only: no payment provider is configured. */
export const COIN_PACKAGES = [
  { id: 'pack-60', coins: 60, bonus: 0, price: 'INR 79' },
  { id: 'pack-300', coins: 300, bonus: 15, price: 'INR 399' },
  { id: 'pack-980', coins: 980, bonus: 70, price: 'INR 1,299', popular: true },
  { id: 'pack-1980', coins: 1980, bonus: 200, price: 'INR 2,599' },
  { id: 'pack-3280', coins: 3280, bonus: 400, price: 'INR 4,299' },
  { id: 'pack-6480', coins: 6480, bonus: 1000, price: 'INR 8,499' },
] as const;

/** VIP is bought with coins. Benefits listed are the ones the app actually renders. */
export const VIP_PLANS = [
  { id: 'vip-7', name: 'VIP Week', days: 7, price: 300 },
  { id: 'vip-30', name: 'VIP Month', days: 30, price: 1000, popular: true },
  { id: 'vip-90', name: 'VIP Season', days: 90, price: 2500 },
] as const;
export const VIP_BENEFITS = [
  { id: 'crown', title: 'Crown badge', desc: 'A gold VIP crown next to your name on your profile' },
  { id: 'ring', title: 'Glowing avatar ring', desc: 'Your photo gets a VIP ring in people lists' },
  { id: 'name', title: 'Golden chat name', desc: 'Your name shows in gold in every room chat' },
] as const;

/** 10 diamonds become 8 coins. */
export const EXCHANGE = { diamonds: 10, coins: 8 } as const;

export function settingsOf(u: Row) {
  const s = u.settings || {};
  return {
    privacy: { ...DEFAULT_SETTINGS.privacy, ...(s.privacy || {}) },
    notify: { ...DEFAULT_SETTINGS.notify, ...(s.notify || {}) },
  };
}

/** Which preference switch controls a notification type. */
export const notifyCategory = (type: string): keyof typeof DEFAULT_SETTINGS.notify | null =>
  type === 'follow' ? 'follows' : type === 'gift' ? 'gifts' : type === 'comment' ? 'comments' : type === 'admin' || type === 'seat-invite' ? 'rooms' : null;

export function registerAccount(ctx: Row) {
  const { route, state, save, uid, now, fail, login, hashCode, hashPassword, demo, io, privateUser } = ctx;
  state.resets ??= [];

  // ---- Forgot password ---------------------------------------------------
  // Real delivery needs an email provider. In demo mode the code is returned so the flow can be tested.
  const emailSchema = z.email().max(254);
  route('post', '/auth/password/request', (req: any) => {
    const email = emailSchema.parse(String(req.body?.email || '').trim()).toLowerCase();
    const prior = state.resets.find((r: Row) => r.email === email);
    if (prior && prior.sentAt + 30000 > Date.now()) fail(429, 'RESET_TOO_SOON', 'Please wait 30 seconds before asking for another code');
    if (!demo) fail(503, 'EMAIL_UNAVAILABLE', 'Password reset email is not configured on this server yet');
    const u = state.users.find((x: Row) => x.email === email && !x.disabled && x.password);
    state.resets = state.resets.filter((r: Row) => r.email !== email && r.expiresAt > Date.now());
    if (!u) return { sent: true }; // same answer for unknown emails
    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    state.resets.push({ email, hash: hashCode(email + ':' + code), expiresAt: Date.now() + 15 * 60000, sentAt: Date.now(), attempts: 0 });
    save();
    return { sent: true, devCode: code };
  }, false);

  route('post', '/auth/password/reset', (req: any) => {
    const b = z.object({ email: emailSchema, code: z.string().regex(/^[0-9]{6}$/, 'Enter the 6-digit code'), newPassword: z.string().min(8).max(128) }).parse(req.body);
    const email = b.email.toLowerCase();
    const r = state.resets.find((x: Row) => x.email === email);
    if (!r || r.expiresAt < Date.now()) fail(401, 'RESET_INVALID', 'Code expired or not requested');
    if (++r.attempts > 5) { state.resets = state.resets.filter((x: Row) => x !== r); save(); fail(429, 'RESET_LOCKED', 'Too many attempts, request a new code'); }
    if (r.hash !== hashCode(email + ':' + b.code)) { save(); fail(401, 'RESET_INVALID', 'Code is incorrect'); }
    const u = state.users.find((x: Row) => x.email === email && !x.disabled);
    if (!u) fail(404, 'NOT_FOUND', 'Account not found');
    state.resets = state.resets.filter((x: Row) => x !== r);
    u.password = hashPassword(b.newPassword);
    state.sessions = state.sessions.filter((s: Row) => s.userId !== u.id);
    for (const sk of io.sockets.sockets.values()) if (sk.data.userId === u.id) sk.disconnect(true);
    return login(u);
  }, false);

  // ---- Preferences -------------------------------------------------------
  route('get', '/me/settings', (_: any, u: Row) => settingsOf(u));
  route('patch', '/me/settings', (req: any, u: Row) => {
    const b = z.object({
      privacy: z.object({ dmFromStrangers: z.boolean(), showVisits: z.boolean() }).partial().optional(),
      notify: z.object({ follows: z.boolean(), gifts: z.boolean(), comments: z.boolean(), rooms: z.boolean() }).partial().optional(),
    }).parse(req.body ?? {});
    const cur = settingsOf(u);
    u.settings = { privacy: { ...cur.privacy, ...(b.privacy || {}) }, notify: { ...cur.notify, ...(b.notify || {}) } };
    save();
    return settingsOf(u);
  });

  // ---- VIP -------------------------------------------------------------
  route('get', '/vip', () => ({ available: true, plans: VIP_PLANS, benefits: VIP_BENEFITS }), false);
  route('post', '/vip/:id/subscribe', (req: any, u: Row) => {
    const plan = VIP_PLANS.find(p => p.id === req.params.id) || fail(404, 'NOT_FOUND', 'VIP plan not found');
    if ((u.coins || 0) < plan.price) fail(409, 'INSUFFICIENT_COINS', `You need ${plan.price} coins for ${plan.name}`);
    const active = u.vip && u.vipUntil && Date.parse(u.vipUntil) > Date.now();
    const base = active ? Date.parse(u.vipUntil) : Date.now();
    u.coins -= plan.price; u.vip = true; u.vipUntil = new Date(base + plan.days * 86400000).toISOString();
    state.ledger.push({ id: uid(), fromId: u.id, type: 'vip-purchase', amount: plan.price, itemId: plan.id, createdAt: now() });
    save();
    io.to('user:' + u.id).emit('wallet:updated', { coins: u.coins, diamonds: u.diamonds });
    return { vipUntil: u.vipUntil, user: privateUser(u) };
  });

  // ---- Wallet ------------------------------------------------------------
  route('get', '/wallet/packages', () => ({ available: false, reason: 'Payments are not configured yet. Coin packages are shown for preview only.', packages: COIN_PACKAGES, exchange: EXCHANGE }), false);
  route('post', '/wallet/exchange', (req: any, u: Row) => {
    const { diamonds } = z.object({ diamonds: z.number().int().min(EXCHANGE.diamonds).max(1_000_000) }).parse(req.body);
    if (diamonds % EXCHANGE.diamonds) fail(400, 'INVALID_AMOUNT', `Exchange diamonds in multiples of ${EXCHANGE.diamonds}`);
    if ((u.diamonds || 0) < diamonds) fail(409, 'INSUFFICIENT_DIAMONDS', 'Not enough diamonds');
    const coins = (diamonds / EXCHANGE.diamonds) * EXCHANGE.coins;
    u.diamonds -= diamonds; u.coins += coins;
    state.ledger.push({ id: uid(), fromId: u.id, type: 'exchange', amount: coins, diamonds, createdAt: now() });
    save();
    io.to('user:' + u.id).emit('wallet:updated', { coins: u.coins, diamonds: u.diamonds });
    return { coins: u.coins, diamonds: u.diamonds, received: coins, user: privateUser(u) };
  });
}
