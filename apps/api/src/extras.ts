// Room admins and themes, room lookup by ID, people search, profile visitors,
// photo upload, honor medals and in-app notifications.
import { z } from 'zod';
type Row = Record<string, any>;

export const ROOM_THEMES = ['teal', 'galaxy', 'sunset', 'ocean', 'forest', 'royal', 'midnight'] as const;
const PHOTO_MAX = 600_000; // bytes of base64 text

export function medalsFor(u: Row, state: Row) {
  const sent = state.ledger.filter((t: Row) => t.type === 'gift' && t.fromId === u.id).reduce((a: number, t: Row) => a + t.amount, 0);
  const got = state.ledger.filter((t: Row) => t.type === 'gift' && t.recipientId === u.id).reduce((a: number, t: Row) => a + t.amount, 0);
  const hosted = state.rooms.filter((r: Row) => r.ownerId === u.id).length;
  const posts = state.posts.filter((p: Row) => p.authorId === u.id).length;
  const followers = (u.followers || []).length; const level = u.level || 1;
  const m = (id: string, name: string, desc: string, value: number, goal: number) => ({ id, name, desc, value, goal, earned: value >= goal });
  return [
    m('generous', 'Generous Heart', 'Send gifts worth 500 coins', sent, 500),
    m('star', 'Rising Star', 'Receive gifts worth 500 coins', got, 500),
    m('host', 'Party Host', 'Create a room', hosted, 1),
    m('popular', 'Popular', 'Get 10 followers', followers, 10),
    m('writer', 'Storyteller', 'Share 3 posts', posts, 3),
    m('veteran', 'Veteran', 'Reach level 20', level, 20),
  ];
}

export function registerExtras(ctx: Row) {
  const { app, route, state, save, uid, now, fail, room, member, owner, mod, io, publicUser, user, cleanRoom, emitRoom, notify, blocked } = ctx;
  state.visits ??= []; state.notifications ??= []; state.photos ??= {};

  // ---- room admins, theme and lookup ----
  route('post', '/rooms/:id/admins', (req: any, u: Row) => {
    const r = room(req.params.id); owner(r, u);
    const { userId, admin } = z.object({ userId: z.string(), admin: z.boolean() }).parse(req.body);
    if (userId === r.ownerId) fail(400, 'INVALID_ADMIN', 'The host is already in charge'); if (!r.members.includes(userId)) fail(409, 'NOT_IN_ROOM', 'Person is not in this room');
    r.admins = (r.admins || []).filter((x: string) => x !== userId); if (admin) { r.admins.push(userId); notify(userId, 'admin', u.id, `${u.name} made you an admin of ${r.title}`); }
    save(); emitRoom(r); return cleanRoom(r);
  });
  route('post', '/rooms/:id/theme', (req: any, u: Row) => {
    const r = room(req.params.id); mod(r, u); const { theme } = z.object({ theme: z.enum(ROOM_THEMES) }).parse(req.body);
    r.theme = theme; save(); emitRoom(r); return cleanRoom(r);
  });
  route('post', '/rooms/:id/notice', (req: any, u: Row) => {
    const r = room(req.params.id); mod(r, u); const { notice } = z.object({ notice: z.string().trim().max(140) }).parse(req.body);
    r.notice = notice; save(); emitRoom(r); return cleanRoom(r);
  });
  route('get', '/room-code/:code', (req: any) => {
    const code = String(req.params.code).trim(); const r = state.rooms.find((x: Row) => x.code === code || x.id === code) || fail(404, 'NOT_FOUND', 'No room with that ID');
    return cleanRoom(r);
  });

  // ---- people ----
  route('get', '/people/search', (req: any, u: Row) => {
    const q = String(req.query.q || '').trim().toLowerCase(); if (q.length < 1) return [];
    return state.users.filter((x: Row) => !x.disabled && x.id !== u.id && !blocked(u, x) && !String(x.id).startsWith('bot-') && (x.name.toLowerCase().includes(q) || (x.hometown || '').toLowerCase().includes(q))).slice(0, 30).map(publicUser);
  });
  route('get', '/me/visitors', (_: any, u: Row) => {
    const seen = new Set<string>(); const out: Row[] = [];
    for (const v of [...state.visits].reverse()) { if (v.userId !== u.id || seen.has(v.visitorId)) continue; const x = state.users.find((y: Row) => y.id === v.visitorId); if (!x || x.disabled || blocked(u, x)) continue; seen.add(v.visitorId); out.push({ user: publicUser(x), at: v.at }); if (out.length >= 50) break; }
    return out;
  });
  route('get', '/users/:id/honor', (req: any) => medalsFor(user(req.params.id), state));

  // ---- photo upload ----
  route('post', '/me/photo', (req: any, u: Row) => {
    const { data } = z.object({ data: z.string().max(PHOTO_MAX).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/) }).parse(req.body);
    state.photos[u.id] = data; u.photo = `/api/photos/${u.id}?v=${Date.now()}`; save(); return publicUser(u);
  });
  route('delete', '/me/photo', (_: any, u: Row) => { delete state.photos[u.id]; u.photo = ''; save(); return publicUser(u); });
  app.get('/api/photos/:id', (req: any, res: any) => {
    const data: string | undefined = state.photos[req.params.id]; if (!data) return res.status(404).end();
    const [, type, b64] = data.match(/^data:(image\/[a-z]+);base64,(.+)$/) || [];
    res.set({ 'Content-Type': type, 'Cache-Control': 'public, max-age=86400', 'Cross-Origin-Resource-Policy': 'cross-origin' }).send(Buffer.from(b64, 'base64'));
  });

  // ---- notifications ----
  route('get', '/me/notifications', (_: any, u: Row) => state.notifications.filter((n: Row) => n.userId === u.id).slice(-50).reverse().map((n: Row) => { const from = state.users.find((x: Row) => x.id === n.fromId); return { ...n, from: from ? publicUser(from) : null }; }));
  route('post', '/me/notifications/read', (_: any, u: Row) => { for (const n of state.notifications) if (n.userId === u.id) n.read = true; save(); return { ok: true }; });
}
