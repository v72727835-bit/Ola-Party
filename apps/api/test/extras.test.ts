import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { newDeck, playable, unoEngine } from '../src/uno.js';

test('uno deck and matching rules', () => {
  const d = newDeck(); assert.equal(d.length, 108); assert.equal(new Set(d.map(c => c.id)).size, 108);
  const top = { id: 't', color: 'red', value: '5' };
  assert.ok(playable({ id: 'a', color: 'red', value: '9' }, top, 'red')); assert.ok(playable({ id: 'b', color: 'blue', value: '5' }, top, 'red'));
  assert.ok(playable({ id: 'c', color: 'wild', value: 'wild4' }, top, 'red')); assert.ok(!playable({ id: 'd', color: 'blue', value: '7' }, top, 'red'));
});

test('uno engine: draw2 makes next player draw and skips them; win on last card', () => {
  const state: Record<string, any> = { users: [] }; const E = unoEngine(state);
  const g: Record<string, any> = { id: 'g1', playerIds: ['a', 'b', 'c'], bots: {}, log: [] }; E.start(g);
  const p = E.priv(g); p.hands.a = [{ id: 'x', color: g.color, value: 'draw2' }, { id: 'y', color: 'wild', value: 'wild' }];
  const before = p.hands.b.length; E.play(g, 'a', 'x'); assert.equal(p.hands.b.length, before + 2); assert.equal(g.turn, 'c');
  g.turn = 'a'; E.play(g, 'a', 'y', 'blue'); assert.equal(g.status, 'finished'); assert.equal(g.winnerId, 'a');
});

test('extras API: profile fields, photo, search, visitors, honor, admins, theme, room code, notifications, uno', async () => {
  const server = createApp({ dataFile: join(mkdtempSync(join(tmpdir(), 'party-extra-')), 'state.json'), demo: true }); const api = request(server.app);
  try {
    const reg = async (name: string) => (await api.post('/api/auth/register').send({ name, email: name + '@x.dev', password: 'test-pass-123' })).body.data;
    const A = (t: string) => ({ Authorization: 'Bearer ' + t });
    const a = await reg('Alicex'), b = await reg('Bobbyx');
    const me = (await api.patch('/api/me').set(A(a.token)).send({ hometown: 'Varanasi', birthday: '2001-04-12', gender: 'female', tags: ['Music', 'Chai'] }).expect(200)).body.data;
    assert.equal(me.hometown, 'Varanasi'); assert.deepEqual(me.tags, ['Music', 'Chai']);
    const png = 'data:image/png;base64,' + Buffer.from('fakepng').toString('base64');
    const withPhoto = (await api.post('/api/me/photo').set(A(a.token)).send({ data: png }).expect(200)).body.data;
    assert.match(withPhoto.photo, /^\/api\/photos\//);
    const img = await api.get(withPhoto.photo.split('?')[0]).expect(200); assert.equal(img.headers['content-type'], 'image/png');
    await api.post('/api/me/photo').set(A(a.token)).send({ data: 'javascript:alert(1)' }).expect(400);
    assert.equal((await api.get('/api/people/search?q=bobb').set(A(a.token))).body.data[0].id, b.user.id);
    await api.get(`/api/users/${a.user.id}`).set(A(b.token)).expect(200);
    assert.equal((await api.get('/api/me/visitors').set(A(a.token))).body.data[0].user.id, b.user.id);
    await api.post(`/api/users/${a.user.id}/follow`).set(A(b.token)).send({}).expect(200);
    const notes = (await api.get('/api/me/notifications').set(A(a.token))).body.data; assert.equal(notes[0].type, 'follow');
    const honor = (await api.get(`/api/users/${a.user.id}/honor`).set(A(b.token))).body.data; assert.ok(honor.find((m: any) => m.id === 'host'));
    const room = (await api.post('/api/rooms').set(A(a.token)).send({ title: 'Extras room' })).body.data; assert.ok(room.code);
    assert.equal((await api.get(`/api/room-code/${room.code}`).set(A(b.token))).body.data.id, room.id);
    await api.post(`/api/rooms/${room.id}/join`).set(A(b.token)).send({}).expect(200);
    await api.post(`/api/rooms/${room.id}/seats/1`).set(A(b.token)).send({ action: 'mute' }).expect(403);
    await api.post(`/api/rooms/${room.id}/admins`).set(A(a.token)).send({ userId: b.user.id, admin: true }).expect(200);
    await api.post(`/api/rooms/${room.id}/seats/1`).set(A(b.token)).send({ action: 'lock' }).expect(200);
    await api.post(`/api/rooms/${room.id}/seats/0`).set(A(b.token)).send({ action: 'mute' }).expect(403); // host seat protected
    await api.post(`/api/rooms/${room.id}/kick`).set(A(b.token)).send({ userId: a.user.id }).expect(403);
    assert.equal((await api.post(`/api/rooms/${room.id}/theme`).set(A(b.token)).send({ theme: 'ocean' }).expect(200)).body.data.theme, 'ocean');
    // levels grow from chat
    const lv = (await api.get('/api/me').set(A(b.token))).body.data.level;
    for (let i = 0; i < 25; i++) await api.post(`/api/rooms/${room.id}/messages`).set(A(b.token)).send({ text: 'hi ' + i });
    assert.ok((await api.get('/api/me').set(A(b.token))).body.data.level > lv);
    // uno
    const g = (await api.post('/api/games/uno').set(A(a.token)).send({ roomId: room.id }).expect(200)).body.data;
    await api.post(`/api/games/${g.id}/uno-join`).set(A(b.token)).send({}).expect(200);
    const started = (await api.post(`/api/games/${g.id}/uno-start`).set(A(a.token)).send({}).expect(200)).body.data;
    assert.equal(started.counts[a.user.id], 7); assert.equal(started.hands, undefined);
    const hand = (await api.get(`/api/games/${g.id}/uno-hand`).set(A(a.token))).body.data; assert.equal(hand.cards.length, 7);
    await api.post(`/api/games/${g.id}/uno-draw`).set(A(b.token)).send({}).expect(409);
    if (hand.playable.length) { const card = hand.cards.find((c: any) => c.id === hand.playable[0]); await api.post(`/api/games/${g.id}/uno-play`).set(A(a.token)).send({ card: card.id, color: card.color === 'wild' ? 'red' : undefined }).expect(200); }
    else await api.post(`/api/games/${g.id}/uno-draw`).set(A(a.token)).send({}).expect(200);
  } finally { await server.close(); }
});
