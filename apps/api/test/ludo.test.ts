import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { legalMoves, applyMove, doRoll, doMove, botChoice, absoluteSquare, HOME } from '../src/ludo.js';

const game = (a: number[], b: number[]) => ({ playerIds: ['a', 'b'], colors: { a: 'red', b: 'yellow' }, tokens: { a: [...a], b: [...b] }, turn: 'a', phase: 'roll', status: 'playing', sixes: 0, log: [] as string[] } as Record<string, any>);

test('ludo legal moves: six to leave yard, exact roll to reach home', () => {
  const g = game([-1, -1, 10, 54], [-1, -1, -1, -1]);
  assert.deepEqual(legalMoves(g, 'a', 3), [2]);
  assert.deepEqual(legalMoves(g, 'a', 2), [2, 3]);
  assert.deepEqual(legalMoves(g, 'a', 6), [0, 1, 2]);
});

test('ludo capture sends opponent home, safe squares protect', () => {
  // red progress 30 -> absolute 30; yellow progress 4 -> absolute 30
  const g = game([27, -1, -1, -1], [4, -1, -1, -1]);
  assert.equal(absoluteSquare('red', 30), absoluteSquare('yellow', 4));
  const r = applyMove(g, 'a', 0, 3); assert.ok(r.captured); assert.equal(g.tokens.b[0], -1);
  // absolute 34 is a safe square: red progress 34, yellow progress 8
  const g2 = game([31, -1, -1, -1], [8, -1, -1, -1]);
  assert.ok(!applyMove(g2, 'a', 0, 3).captured); assert.equal(g2.tokens.b[0], 8);
});

test('ludo turns: extra turn on six, pass on no move, win when all home', () => {
  const g = game([-1, -1, -1, -1], [-1, -1, -1, -1]);
  assert.deepEqual(doRoll(g, 4), []); assert.equal(g.turn, 'b');
  g.turn = 'a'; assert.deepEqual(doRoll(g, 6), [0, 1, 2, 3]); doMove(g, 0); assert.equal(g.turn, 'a'); assert.equal(g.tokens.a[0], 0);
  const w = game([HOME, HOME, HOME, 53], [-1, -1, -1, -1]); doRoll(w, 3); doMove(w, 3); assert.equal(w.status, 'finished'); assert.equal(w.winnerId, 'a');
  const c = game([27, 5, -1, -1], [4, -1, -1, -1]); c.dice = 3; assert.equal(botChoice(c, 'a', [0, 1]), 0);
});

test('ludo API: create, join, computer player, start and roll', async () => {
  const server = createApp({ dataFile: join(mkdtempSync(join(tmpdir(), 'party-ludo-')), 'state.json'), demo: true }); const api = request(server.app);
  try {
    const reg = async (name: string) => (await api.post('/api/auth/register').send({ name, email: name + '@ludo.dev', password: 'test-pass-123' })).body.data;
    const A = (t: string) => ({ Authorization: 'Bearer ' + t });
    const host = await reg('Hostl'), guest = await reg('Guestl');
    const room = (await api.post('/api/rooms').set(A(host.token)).send({ title: 'Ludo room' })).body.data;
    await api.post(`/api/rooms/${room.id}/join`).set(A(guest.token)).send({}).expect(200);
    const g = (await api.post('/api/games/ludo').set(A(host.token)).send({ roomId: room.id }).expect(200)).body.data;
    await api.post(`/api/games/${g.id}/ludo-start`).set(A(host.token)).send({}).expect(409); // needs 2 players
    await api.post(`/api/games/${g.id}/ludo-join`).set(A(guest.token)).send({}).expect(200);
    await api.post(`/api/games/${g.id}/ludo-bot`).set(A(guest.token)).send({}).expect(403); // host only
    const withBot = (await api.post(`/api/games/${g.id}/ludo-bot`).set(A(host.token)).send({}).expect(200)).body.data;
    assert.equal(withBot.players.length, 3); assert.equal(withBot.players[2].bot, true);
    await api.post(`/api/games/${g.id}/join`).set(A(guest.token)).send({}).expect(409);
    const started = (await api.post(`/api/games/${g.id}/ludo-start`).set(A(host.token)).send({}).expect(200)).body.data;
    assert.equal(started.status, 'playing'); assert.equal(started.colors[host.user.id], 'red');
    await api.post(`/api/games/${g.id}/roll`).set(A(guest.token)).send({}).expect(409); // not guest's turn
    const rolled = (await api.post(`/api/games/${g.id}/roll`).set(A(host.token)).send({}).expect(200)).body.data;
    assert.ok(rolled.dice >= 1 && rolled.dice <= 6);
    assert.equal((await api.get('/api/games').set(A(host.token))).body.data.find((x: any) => x.id === g.id).players.length, 3);
  } finally { await server.close(); }
});
