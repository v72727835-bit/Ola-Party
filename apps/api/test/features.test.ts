import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { splitShares, connectFourWinner } from '../src/features.js';

test('splitShares always sums to total with positive parts', () => {
  for (let i = 0; i < 200; i++) { const total = 10 + (i * 7) % 500, count = 2 + (i % 9); const s = splitShares(total, count); assert.equal(s.length, count); assert.equal(s.reduce((a, b) => a + b, 0), total); assert.ok(s.every(x => x >= 1)); }
});
test('connect four detects all four directions', () => {
  const b = (cells: number[]) => { const a: (string | null)[] = Array(42).fill(null); cells.forEach(i => (a[i] = 'R')); return a; };
  assert.ok(connectFourWinner(b([35, 36, 37, 38]), 'R')); assert.ok(connectFourWinner(b([0, 7, 14, 21]), 'R'));
  assert.ok(connectFourWinner(b([0, 8, 16, 24]), 'R')); assert.ok(connectFourWinner(b([3, 9, 15, 21]), 'R')); assert.ok(!connectFourWinner(b([0, 1, 2, 4]), 'R'));
});

test('queue, decorations, connect four, lucky bags, tasks and phone OTP', async () => {
  const server = createApp({ dataFile: join(mkdtempSync(join(tmpdir(), 'party-feat-')), 'state.json'), demo: true }); const api = request(server.app);
  try {
    const reg = async (name: string) => (await api.post('/api/auth/register').send({ name, email: name + '@test.dev', password: 'test-pass-123' })).body.data;
    const A = (t: string) => ({ Authorization: 'Bearer ' + t });
    const host = await reg('Hosty'), g1 = await reg('Guesta'), g2 = await reg('Guestb');
    const room = (await api.post('/api/rooms').set(A(host.token)).send({ title: 'Queue room' })).body.data;
    for (const g of [g1, g2]) await api.post(`/api/rooms/${room.id}/join`).set(A(g.token)).send({}).expect(200);

    // mic queue
    await api.post(`/api/rooms/${room.id}/queue`).set(A(host.token)).send({ action: 'join' }).expect(409); // owner already seated
    await api.post(`/api/rooms/${room.id}/queue`).set(A(g1.token)).send({ action: 'join' }).expect(200);
    await api.post(`/api/rooms/${room.id}/queue`).set(A(g1.token)).send({ action: 'join' }).expect(409);
    await api.post(`/api/rooms/${room.id}/queue`).set(A(g2.token)).send({ action: 'join' }).expect(200);
    await api.post(`/api/rooms/${room.id}/queue/promote`).set(A(g2.token)).send({}).expect(403);
    const promoted = await api.post(`/api/rooms/${room.id}/queue/promote`).set(A(host.token)).send({}).expect(200);
    assert.equal(promoted.body.data.queue.length, 1); assert.equal(promoted.body.data.queue[0].id, g2.user.id);
    assert.equal((await api.get(`/api/rooms/${room.id}`).set(A(g1.token))).body.data.seats.find((s: any) => s.userId === g1.user.id).index, promoted.body.data.seat);

    // decorations
    await api.post('/api/decorations/badge-star/buy').set(A(g1.token)).send({}).expect(409); // no coins
    await api.post('/api/wallet/demo-credit').set(A(g1.token)).send({ amount: 500 }).expect(200);
    await api.post('/api/decorations/badge-star/equip').set(A(g1.token)).send({}).expect(403);
    await api.post('/api/decorations/badge-star/buy').set(A(g1.token)).send({}).expect(200);
    await api.post('/api/decorations/badge-star/buy').set(A(g1.token)).send({}).expect(409);
    const eq = await api.post('/api/decorations/badge-star/equip').set(A(g1.token)).send({}).expect(200); assert.equal(eq.body.data.equipped.badge, 'badge-star'); assert.equal(eq.body.data.coins, 350);
    assert.equal((await api.get(`/api/users/${g1.user.id}`).set(A(host.token))).body.data.equipped.badge, 'badge-star');
    await api.delete('/api/decorations/slot/badge').set(A(g1.token)).expect(200);

    // connect four
    const game = (await api.post('/api/games/connect-four').set(A(host.token)).send({ roomId: room.id })).body.data;
    await api.post(`/api/games/${game.id}/join`).set(A(g1.token)).send({}).expect(200);
    await api.post(`/api/games/${game.id}/move`).set(A(host.token)).send({ index: 0 }).expect(409); // wrong endpoint
    for (let i = 0; i < 3; i++) { await api.post(`/api/games/${game.id}/drop`).set(A(host.token)).send({ column: 0 }).expect(200); await api.post(`/api/games/${game.id}/drop`).set(A(g1.token)).send({ column: 1 }).expect(200); }
    await api.post(`/api/games/${game.id}/drop`).set(A(g1.token)).send({ column: 2 }).expect(409); // not your turn
    const win = (await api.post(`/api/games/${game.id}/drop`).set(A(host.token)).send({ column: 0 }).expect(200)).body.data;
    assert.equal(win.status, 'finished'); assert.equal(win.winnerId, host.user.id);

    // lucky bag
    await api.post('/api/wallet/demo-credit').set(A(host.token)).send({ amount: 200 }).expect(200);
    await api.post(`/api/rooms/${room.id}/lucky-bags`).set(A(host.token)).send({ total: 5000, count: 3 }).expect(409);
    const bag = (await api.post(`/api/rooms/${room.id}/lucky-bags`).set(A(host.token)).send({ total: 100, count: 2 })).body.data; assert.equal(bag.remaining, 2);
    assert.equal((await api.get('/api/wallet').set(A(host.token))).body.data.coins, 100);
    await api.post(`/api/lucky-bags/${bag.id}/claim`).set(A(host.token)).send({}).expect(403);
    const c1 = (await api.post(`/api/lucky-bags/${bag.id}/claim`).set(A(g1.token)).send({}).expect(200)).body.data.amount;
    await api.post(`/api/lucky-bags/${bag.id}/claim`).set(A(g1.token)).send({}).expect(409);
    const c2 = (await api.post(`/api/lucky-bags/${bag.id}/claim`).set(A(g2.token)).send({}).expect(200)).body.data.amount;
    assert.equal(c1 + c2, 100); await api.post(`/api/lucky-bags/${bag.id}/claim`).set(A(host.token)).send({}).expect(403);

    // tasks need real activity
    const hostTasks = (await api.get('/api/tasks').set(A(host.token))).body.data; assert.equal(hostTasks.length, 4);
    await api.post('/api/tasks/post-today/claim').set(A(host.token)).send({}).expect(409);
    await api.post('/api/posts').set(A(host.token)).send({ text: 'hello world' }).expect(200);
    await api.post('/api/tasks/post-today/claim').set(A(host.token)).send({}).expect(200);
    await api.post('/api/tasks/post-today/claim').set(A(host.token)).send({}).expect(409);

    // phone OTP
    await api.post('/api/auth/otp/request').send({ phone: 'abc' }).expect(400);
    const req1 = (await api.post('/api/auth/otp/request').send({ phone: '+919876543210' }).expect(200)).body.data; assert.match(req1.devCode, /^[0-9]{6}$/);
    await api.post('/api/auth/otp/request').send({ phone: '+919876543210' }).expect(429);
    await api.post('/api/auth/otp/verify').send({ phone: '+919876543210', code: req1.devCode === '000000' ? '111111' : '000000' }).expect(401);
    const ok = await api.post('/api/auth/otp/verify').send({ phone: '+919876543210', code: req1.devCode, name: 'Phone User' }).expect(200);
    await api.get('/api/me').set(A(ok.body.data.token)).expect(200);
    await api.post('/api/auth/otp/verify').send({ phone: '+919876543210', code: req1.devCode }).expect(401); // single use
  } finally { await server.close(); }
});
