import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';

test('forgot password, preferences and diamond exchange', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'party-recover-')); const server = createApp({ dataFile: join(dir, 'state.json'), demo: true }); const api = request(server.app);
  try {
    const reg = (await api.post('/api/auth/register').send({ name: 'Esha', email: 'esha@test.dev', password: 'first-pass-1' })).body.data;
    const auth = { Authorization: 'Bearer ' + reg.token };
    // unknown email gets the same answer but no code
    const unknown = (await api.post('/api/auth/password/request').send({ email: 'nobody@test.dev' }).expect(200)).body.data;
    assert.equal(unknown.sent, true); assert.equal(unknown.devCode, undefined);
    const req1 = (await api.post('/api/auth/password/request').send({ email: 'ESHA@test.dev' }).expect(200)).body.data;
    assert.match(req1.devCode, /^\d{6}$/);
    await api.post('/api/auth/password/request').send({ email: 'esha@test.dev' }).expect(429);
    const wrong = req1.devCode === '000000' ? '111111' : '000000';
    await api.post('/api/auth/password/reset').send({ email: 'esha@test.dev', code: wrong, newPassword: 'second-pass-2' }).expect(401);
    await api.post('/api/auth/password/reset').send({ email: 'esha@test.dev', code: req1.devCode, newPassword: 'short' }).expect(400);
    const reset = (await api.post('/api/auth/password/reset').send({ email: 'esha@test.dev', code: req1.devCode, newPassword: 'second-pass-2' }).expect(200)).body.data;
    assert.ok(reset.token);
    await api.get('/api/me').set(auth).expect(401); // old sessions revoked
    await api.post('/api/auth/password/reset').send({ email: 'esha@test.dev', code: req1.devCode, newPassword: 'third-pass-3' }).expect(401); // single use
    await api.post('/api/auth/login').send({ email: 'esha@test.dev', password: 'first-pass-1' }).expect(401);
    await api.post('/api/auth/login').send({ email: 'esha@test.dev', password: 'second-pass-2' }).expect(200);

    const a2 = { Authorization: 'Bearer ' + reset.token };
    const def = (await api.get('/api/me/settings').set(a2).expect(200)).body.data;
    assert.equal(def.privacy.dmFromStrangers, true); assert.equal(def.notify.gifts, true);
    const upd = (await api.patch('/api/me/settings').set(a2).send({ privacy: { dmFromStrangers: false }, notify: { gifts: false } }).expect(200)).body.data;
    assert.equal(upd.privacy.dmFromStrangers, false); assert.equal(upd.privacy.showVisits, true); assert.equal(upd.notify.gifts, false); assert.equal(upd.notify.follows, true);
    await api.patch('/api/me/settings').set(a2).send({ notify: { gifts: 'no' } }).expect(400);

    // a stranger cannot DM Esha now
    const other = (await api.post('/api/auth/register').send({ name: 'Farid', email: 'farid@test.dev', password: 'farid-pass-1' })).body.data;
    const oa = { Authorization: 'Bearer ' + other.token };
    await api.post(`/api/users/${reg.user.id}/messages`).set(oa).send({ text: 'hi' }).expect(403);
    await api.post(`/api/users/${other.user.id}/follow`).set(a2).send({}).expect(200);
    await api.post(`/api/users/${reg.user.id}/messages`).set(oa).send({ text: 'hi' }).expect(200);

    // packages are preview-only; exchange needs diamonds
    const pk = (await api.get('/api/wallet/packages').expect(200)).body.data;
    assert.equal(pk.available, false); assert.ok(pk.packages.length >= 4);
    await api.post('/api/wallet/exchange').set(a2).send({ diamonds: 10 }).expect(409);
    await api.post('/api/wallet/exchange').set(a2).send({ diamonds: 15 }).expect(400);
  } finally { await server.close(); }
});

test('VIP subscription with coins extends from current expiry', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'party-vip-')); const server = createApp({ dataFile: join(dir, 'state.json'), demo: true }); const api = request(server.app);
  try {
    const g = (await api.post('/api/auth/demo').send({})).body.data; const auth = { Authorization: 'Bearer ' + g.token };
    const cat = (await api.get('/api/vip').expect(200)).body.data; assert.ok(cat.plans.length === 3 && cat.benefits.length === 3);
    await api.post('/api/vip/vip-30/subscribe').set(auth).send({}).expect(409); // 500 coins < 1000
    await api.post('/api/vip/nope/subscribe').set(auth).send({}).expect(404);
    const one = (await api.post('/api/vip/vip-7/subscribe').set(auth).send({}).expect(200)).body.data;
    assert.equal(one.user.vip, true); assert.equal(one.user.coins, 200);
    await api.post('/api/wallet/demo-credit').set(auth).send({ amount: 200 }).expect(200);
    const two = (await api.post('/api/vip/vip-7/subscribe').set(auth).send({}).expect(200)).body.data;
    const days = (Date.parse(two.vipUntil) - Date.now()) / 86400000; assert.ok(days > 13.9 && days < 14.1);
    const w = (await api.get('/api/wallet').set(auth)).body.data; assert.equal(w.coins, 100); assert.ok(w.ledger.some((l: any) => l.type === 'vip-purchase'));
  } finally { await server.close(); }
});
