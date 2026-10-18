import { createHash, randomInt } from 'node:crypto';
import { z } from 'zod';

type Row = Record<string, any>;

export const decorations = [
  { id: 'frame-spark', name: 'Spark Frame', emoji: '✨', slot: 'frame', price: 300 },
  { id: 'frame-aurora', name: 'Aurora Frame', emoji: '🌌', slot: 'frame', price: 800 },
  { id: 'entrance-rocket', name: 'Rocket Entrance', emoji: '🚀', slot: 'entrance', price: 500 },
  { id: 'entrance-confetti', name: 'Confetti Entrance', emoji: '🎉', slot: 'entrance', price: 250 },
  { id: 'badge-star', name: 'Rising Star', emoji: '⭐', slot: 'badge', price: 150 },
  { id: 'badge-mic', name: 'Mic Master', emoji: '🎤', slot: 'badge', price: 400 },
] as const;

export const dailyTasks = [
  { id: 'daily-login', title: 'Daily check-in', reward: 20 },
  { id: 'send-gift', title: 'Send a gift to someone', reward: 30 },
  { id: 'post-today', title: 'Share a post', reward: 15 },
  { id: 'chat-in-room', title: 'Say hi in a room', reward: 10 },
] as const;

const LUCKY_BAG_TTL_MS = 24 * 3600 * 1000;

/** Splits `total` coins into `count` positive random shares (server-side, hidden from clients). */
export function splitShares(total: number, count: number): number[] {
  const shares = Array(count).fill(1);
  let left = total - count;
  for (let i = 0; i < count - 1 && left > 0; i++) {
    const max = Math.max(0, Math.floor((left * 2) / (count - i)));
    const part = max > 0 ? randomInt(0, max + 1) : 0;
    shares[i] += part; left -= part;
  }
  shares[count - 1] += left;
  for (let i = shares.length - 1; i > 0; i--) { const j = randomInt(0, i + 1); [shares[i], shares[j]] = [shares[j], shares[i]]; }
  return shares;
}

export function connectFourWinner(board: (string | null)[], mark: string): boolean {
  const at = (r: number, c: number) => (r >= 0 && r < 6 && c >= 0 && c < 7 ? board[r * 7 + c] : null);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]])
    if ([0, 1, 2, 3].every(k => at(r + dr * k, c + dc * k) === mark)) return true;
  return false;
}

export function registerFeatures(ctx: Row) {
  const { route, state, save, uid, now, day, fail, room, member, owner, emitRoom, io, publicUser, user, gameView, login, hashCode, demo } = ctx;
  state.luckyBags ??= []; state.otps ??= []; state.games ??= [];
  const catalogItem = (id: string) => decorations.find(d => d.id === id) || fail(404, 'NOT_FOUND', 'Decoration not found');

  // ---- Mic queue -------------------------------------------------------
  const queueOf = (r: Row) => { r.queue = (r.queue ?? []).filter((id: string) => r.members.includes(id) && !r.seats.some((s: Row) => s.userId === id)); return r.queue as string[]; };
  const queueView = (r: Row) => queueOf(r).map(id => publicUser(user(id)));
  const pushQueue = (r: Row) => io.to('room:' + r.id).emit('room:queue', queueView(r));
  route('get', '/rooms/:id/queue', (req: any, u: Row) => { const r = room(req.params.id); member(r, u); return queueView(r); });
  route('post', '/rooms/:id/queue', (req: any, u: Row) => {
    const r = room(req.params.id); member(r, u); const { action } = z.object({ action: z.enum(['join', 'leave']) }).parse(req.body); const q = queueOf(r);
    if (action === 'join') { if (r.seats.some((s: Row) => s.userId === u.id)) fail(409, 'ALREADY_SEATED', 'You already have a seat'); if (q.includes(u.id)) fail(409, 'ALREADY_QUEUED', 'You are already in the queue'); if (q.length >= 50) fail(409, 'QUEUE_FULL', 'The queue is full'); q.push(u.id); }
    else r.queue = q.filter(id => id !== u.id);
    save(); pushQueue(r); return queueView(r);
  });
  route('post', '/rooms/:id/queue/promote', async (req: any, u: Row) => {
    const r = room(req.params.id); owner(r, u); const b = z.object({ userId: z.string().optional() }).parse(req.body ?? {}); const q = queueOf(r);
    const target = b.userId ?? q[0]; if (!target || !q.includes(target)) fail(404, 'NOT_QUEUED', 'Nobody to promote');
    const seat = r.seats.find((s: Row) => !s.userId && !s.locked); if (!seat) fail(409, 'NO_FREE_SEAT', 'No free seat available');
    seat.userId = target; seat.muted = false; r.queue = q.filter(id => id !== target);
    save(); emitRoom(r); pushQueue(r); return { seat: seat.index, queue: queueView(r) };
  });

  // ---- Decorations (frames, entrance effects, badges) ------------------
  const decorView = (u: Row) => ({ coins: u.coins, equipped: u.equipped ?? {}, items: decorations.map(d => ({ ...d, owned: (u.owned ?? []).includes(d.id), equipped: (u.equipped ?? {})[d.slot] === d.id })) });
  route('get', '/decorations', (_: any, u: Row) => decorView(u));
  route('post', '/decorations/:id/buy', (req: any, u: Row) => {
    const d = catalogItem(req.params.id); u.owned ??= []; if (u.owned.includes(d.id)) fail(409, 'ALREADY_OWNED', 'You already own this');
    if (u.coins < d.price) fail(409, 'INSUFFICIENT_COINS', 'Not enough coins');
    u.coins -= d.price; u.owned.push(d.id); state.ledger.push({ id: uid(), fromId: u.id, type: 'decoration-purchase', amount: d.price, itemId: d.id, createdAt: now() });
    save(); io.to('user:' + u.id).emit('wallet:updated', { coins: u.coins, diamonds: u.diamonds }); return decorView(u);
  });
  route('post', '/decorations/:id/equip', (req: any, u: Row) => { const d = catalogItem(req.params.id); if (!(u.owned ?? []).includes(d.id)) fail(403, 'NOT_OWNED', 'Buy this first'); u.equipped = { ...(u.equipped ?? {}), [d.slot]: d.id }; save(); return decorView(u); });
  route('delete', '/decorations/slot/:slot', (req: any, u: Row) => { const slot = z.enum(['frame', 'entrance', 'badge']).parse(req.params.slot); const e = { ...(u.equipped ?? {}) }; delete e[slot]; u.equipped = e; save(); return decorView(u); });

  // ---- Connect Four ------------------------------------------------------
  route('post', '/games/connect-four', (req: any, u: Row) => {
    const { roomId } = z.object({ roomId: z.string() }).parse(req.body); const r = room(roomId); member(r, u);
    const g = { id: uid(), type: 'connect-four', roomId, playerIds: [u.id], board: Array(42).fill(null), turn: u.id, status: 'waiting', winnerId: null, createdAt: now() };
    state.games.push(g); save(); return gameView(g);
  });
  route('post', '/games/:id/drop', (req: any, u: Row) => {
    const { column } = z.object({ column: z.number().int().min(0).max(6) }).parse(req.body); const g = state.games.find((x: Row) => x.id === req.params.id) || fail(404, 'NOT_FOUND', 'Game not found');
    if (g.type !== 'connect-four') fail(409, 'WRONG_GAME', 'This is not a Connect Four game'); member(room(g.roomId), u);
    if (g.status !== 'playing' || g.turn !== u.id || !g.playerIds.includes(u.id)) fail(409, 'INVALID_TURN', 'Wait for your turn');
    let row = -1; for (let r = 5; r >= 0; r--) if (!g.board[r * 7 + column]) { row = r; break; } if (row < 0) fail(409, 'COLUMN_FULL', 'That column is full');
    const mark = g.playerIds[0] === u.id ? 'R' : 'Y'; g.board[row * 7 + column] = mark;
    if (connectFourWinner(g.board, mark)) { g.status = 'finished'; g.winnerId = u.id; } else if (g.board.every(Boolean)) g.status = 'draw'; else g.turn = g.playerIds.find((id: string) => id !== u.id);
    save(); io.to('room:' + g.roomId).emit('game:updated', gameView(g)); return gameView(g);
  });

  // ---- Lucky bags --------------------------------------------------------
  const refundExpired = () => { let changed = false; for (const b of state.luckyBags) if (!b.refunded && b.shares.length && Date.parse(b.createdAt) + LUCKY_BAG_TTL_MS < Date.now()) { const left = b.shares.reduce((s: number, x: number) => s + x, 0); const sender = state.users.find((x: Row) => x.id === b.senderId); if (sender) { sender.coins += left; state.ledger.push({ id: uid(), fromId: 'system', recipientId: sender.id, type: 'lucky-bag-refund', amount: left, createdAt: now() }); } b.shares = []; b.refunded = true; changed = true; } if (changed) save(); };
  const bagView = (b: Row, u: Row) => ({ id: b.id, roomId: b.roomId, sender: publicUser(user(b.senderId)), total: b.total, count: b.count, remaining: b.shares.length, claimed: b.claims.map((c: Row) => ({ user: publicUser(user(c.userId)), amount: c.amount })), mine: b.claims.find((c: Row) => c.userId === u.id)?.amount ?? null, createdAt: b.createdAt });
  route('get', '/rooms/:id/lucky-bags', (req: any, u: Row) => { const r = room(req.params.id); member(r, u); refundExpired(); return state.luckyBags.filter((b: Row) => b.roomId === r.id && (b.shares.length || b.claims.some((c: Row) => c.userId === u.id))).slice(-20).map((b: Row) => bagView(b, u)); });
  route('post', '/rooms/:id/lucky-bags', (req: any, u: Row) => {
    const r = room(req.params.id); member(r, u); const b = z.object({ total: z.number().int().min(10).max(10000), count: z.number().int().min(2).max(20) }).refine(x => x.total >= x.count, 'total must cover every share').parse(req.body);
    if (u.coins < b.total) fail(409, 'INSUFFICIENT_COINS', 'Not enough coins');
    u.coins -= b.total; const bag = { id: uid(), roomId: r.id, senderId: u.id, total: b.total, count: b.count, shares: splitShares(b.total, b.count), claims: [] as Row[], createdAt: now() };
    state.luckyBags.push(bag); state.ledger.push({ id: uid(), fromId: u.id, type: 'lucky-bag', amount: b.total, roomId: r.id, createdAt: now() });
    save(); io.to('user:' + u.id).emit('wallet:updated', { coins: u.coins, diamonds: u.diamonds }); io.to('room:' + r.id).emit('room:lucky-bag', bagView(bag, u)); return bagView(bag, u);
  });
  route('post', '/lucky-bags/:id/claim', (req: any, u: Row) => {
    refundExpired(); const b = state.luckyBags.find((x: Row) => x.id === req.params.id) || fail(404, 'NOT_FOUND', 'Lucky bag not found'); member(room(b.roomId), u);
    if (b.senderId === u.id) fail(403, 'OWN_BAG', 'You cannot claim your own bag'); if (b.claims.some((c: Row) => c.userId === u.id)) fail(409, 'ALREADY_CLAIMED', 'You already claimed this bag'); if (!b.shares.length) fail(409, 'BAG_EMPTY', 'This bag is empty');
    const amount = b.shares.pop(); b.claims.push({ userId: u.id, amount, at: now() }); u.coins += amount; state.ledger.push({ id: uid(), fromId: b.senderId, recipientId: u.id, type: 'lucky-bag-claim', amount, roomId: b.roomId, createdAt: now() });
    save(); io.to('user:' + u.id).emit('wallet:updated', { coins: u.coins, diamonds: u.diamonds }); io.to('room:' + b.roomId).emit('room:lucky-bag', bagView(b, u)); return { amount, coins: u.coins };
  });

  // ---- Daily tasks ---------------------------------------------------------
  const today = (iso: string) => String(iso).slice(0, 10) === day();
  const done: Record<string, (u: Row) => boolean> = {
    'daily-login': () => true,
    'send-gift': u => state.ledger.some((t: Row) => t.type === 'gift' && t.fromId === u.id && today(t.createdAt)),
    'post-today': u => state.posts.some((p: Row) => p.authorId === u.id && today(p.createdAt)),
    'chat-in-room': u => state.messages.some((m: Row) => m.fromId === u.id && m.roomId && today(m.createdAt)),
  };
  const claimed = (u: Row, id: string) => state.claims.some((c: Row) => c.userId === u.id && c.day === day() && c.taskId === id);
  route('get', '/tasks', (_: any, u: Row) => dailyTasks.map(t => ({ ...t, claimed: claimed(u, t.id), ready: done[t.id](u) })));
  route('post', '/tasks/:id/claim', (req: any, u: Row) => {
    const t = dailyTasks.find(x => x.id === req.params.id) || fail(404, 'NOT_FOUND', 'Task not found');
    if (claimed(u, t.id)) fail(409, 'ALREADY_CLAIMED', 'Already claimed today'); if (!done[t.id](u)) fail(409, 'TASK_INCOMPLETE', 'Finish the task first');
    state.claims.push({ userId: u.id, day: day(), taskId: t.id }); u.coins += t.reward; state.ledger.push({ id: uid(), fromId: u.id, type: 'task-reward', amount: t.reward, createdAt: now() }); save(); return { coins: u.coins, reward: t.reward };
  });

  // ---- Phone OTP login (SMS provider required for real delivery) -----------
  const phoneSchema = z.string().trim().regex(/^\+?[0-9]{8,15}$/, 'Enter a valid phone number');
  route('post', '/auth/otp/request', (req: any) => {
    const { phone } = z.object({ phone: phoneSchema }).parse(req.body ?? {}); const prior = state.otps.find((o: Row) => o.phone === phone);
    if (prior && prior.sentAt + 30000 > Date.now()) fail(429, 'OTP_TOO_SOON', 'Please wait before requesting another code');
    if (!demo) fail(503, 'SMS_UNAVAILABLE', 'No SMS provider is configured');
    const code = String(randomInt(0, 1000000)).padStart(6, '0'); state.otps = state.otps.filter((o: Row) => o.phone !== phone && o.expiresAt > Date.now());
    state.otps.push({ phone, hash: hashCode(phone + ':' + code), expiresAt: Date.now() + 300000, sentAt: Date.now(), attempts: 0 }); save();
    return { sent: true, devCode: code };
  }, false);
  route('post', '/auth/otp/verify', (req: any) => {
    const b = z.object({ phone: phoneSchema, code: z.string().regex(/^[0-9]{6}$/), name: z.string().trim().min(2).max(40).optional() }).parse(req.body);
    const o = state.otps.find((x: Row) => x.phone === b.phone); if (!o || o.expiresAt < Date.now()) fail(401, 'OTP_INVALID', 'Code expired or not requested');
    if (++o.attempts > 5) { state.otps = state.otps.filter((x: Row) => x !== o); save(); fail(429, 'OTP_LOCKED', 'Too many attempts, request a new code'); }
    if (o.hash !== hashCode(b.phone + ':' + b.code)) { save(); fail(401, 'OTP_INVALID', 'Code is incorrect'); }
    state.otps = state.otps.filter((x: Row) => x !== o);
    let u = state.users.find((x: Row) => x.phone === b.phone);
    if (u?.disabled) fail(403, 'ACCOUNT_DISABLED', 'This account is disabled');
    if (!u) { u = { id: uid(), name: b.name ?? 'Guest ' + b.phone.slice(-4), email: `phone-${b.phone.replace('+', '')}@phone.invalid`, phone: b.phone, password: '', avatar: '🙂', bio: '', country: 'IN', followers: [], following: [], blocked: [], coins: 0, diamonds: 0, vip: false, role: 'user', demo: false }; state.users.push(u); }
    return login(u);
  }, false);
}

export const sha = (s: string) => createHash('sha256').update(s).digest('hex');
