import { z } from 'zod';
import { gifts, giftCategories } from './gifts.js';
type Row = Record<string, any>;
export function registerGiftFeatures(ctx: Row) {
  const { route, state, save, uid, now, fail, user, publicUser, room, member, mod, notify, io, emitRoom } = ctx;
  const inventory = (u: Row) => (u.giftInventory || []).map((item: Row) => ({ ...item, gift: gifts.find(g => g.id === item.giftId), expired: Date.parse(item.expiresAt) <= Date.now() }));
  route('get', '/rooms/:id/live-data', (req: any, u: Row) => {
    const r = room(req.params.id); member(r, u);
    const localDay = (date: string) => new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const today = localDay(now()); const ledger = state.ledger.filter((t: Row) => t.type === 'gift' && t.roomId === r.id && localDay(t.createdAt) === today);
    return { receivedToday: ledger.filter((t: Row) => t.recipientId === u.id).reduce((s: number, t: Row) => s + t.amount, 0), sentToday: ledger.filter((t: Row) => t.fromId === u.id).reduce((s: number, t: Row) => s + t.amount, 0), members: r.members.length, seats: r.seats.length, occupiedSeats: r.seats.filter((s: Row) => s.userId).length };
  });
  route('get', '/gifts/catalog', () => ({ categories: giftCategories, gifts, broadcastThreshold: 60000, pricing: 'test-coins', artwork: 'Original symbolic artwork; not the source application assets' }), false);
  route('get', '/me/gift-inventory', (_req: any, u: Row) => inventory(u));
  route('post', '/me/gift-inventory/demo', (_req: any, u: Row) => {
    if (!ctx.demo || !u.demo) fail(403, 'DEMO_DISABLED', 'Sample parcels require a demo account');
    if (u.demoParcelClaimed) fail(409, 'ALREADY_CLAIMED', 'Sample parcel already claimed');
    u.demoParcelClaimed = true;
    (u.giftInventory ??= []).push({ id: uid(), giftId: 'like', quantity: 5, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() });
    save(); return inventory(u);
  });
  route('get', '/me/custom-gifts', (_req: any, u: Row) => u.customGifts || []);
  route('post', '/me/custom-gifts', (req: any, u: Row) => {
    const b = z.object({ giftId: z.string(), label: z.string().trim().min(1).max(24), message: z.string().trim().max(80), color: z.enum(['gold', 'pink', 'blue', 'purple']) }).parse(req.body);
    const g = gifts.find(g => g.id === b.giftId);
    if (!g?.customizable) fail(400, 'NOT_CUSTOMIZABLE', 'Choose an Ultra Star or Fame gift');
    const list: Row[] = u.customGifts ??= []; const existing = list.find(g => g.giftId === b.giftId);
    const result = { id: existing?.id || uid(), ...b, updatedAt: now() };
    if (existing) Object.assign(existing, result); else list.push(result);
    save(); return result;
  });
  route('get', '/users/:id/gift-wall', (req: any) => {
    const target = user(req.params.id);
    const ledger = state.ledger.filter((t: Row) => t.type === 'gift' && t.recipientId === target.id);
    return { total: ledger.reduce((s: number, t: Row) => s + t.amount, 0), gifts: gifts.map(g => ({ ...g, received: ledger.filter((t: Row) => t.giftId === g.id).reduce((s: number, t: Row) => s + t.quantity, 0) })).filter(g => g.received > 0) };
  });
  route('get', '/wallet/recharge', (_req: any, u: Row) => ({ available: false, demo: !!ctx.demo, region: u.country || 'IN', message: 'Real recharge is not configured. No payment has been taken.', agreement: 'Demo coins have no monetary value.' }));
  route('post', '/rooms/:id/seats/:index/invite', (req: any, u: Row) => {
    const r = room(req.params.id); mod(r, u);
    const index = z.coerce.number().int().min(0).max(r.seats.length - 1).parse(req.params.index);
    const { userId } = z.object({ userId: z.string() }).parse(req.body); const target = user(userId); member(r, target);
    if (r.seats[index].locked || r.seats[index].userId) fail(409, 'SEAT_UNAVAILABLE', 'Choose a free unlocked seat');
    const invite = { roomId: r.id, index, from: publicUser(u), expiresAt: new Date(Date.now() + 60000).toISOString() };
    (r.seatInvites ??= {})[userId] = invite;
    notify(userId, 'seat-invite', u.id, `${u.name} invited you to seat ${index + 1} in ${r.title}`);
    save(); io.to('user:' + userId).emit('room:seat-invite', invite); return invite;
  });
}
