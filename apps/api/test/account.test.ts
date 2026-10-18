import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
test('password change, data export and account deletion', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'party-acct-')); const server = createApp({ dataFile: join(dir, 'state.json'), demo: true }); const api = request(server.app);
  try {
    const reg = (await api.post('/api/auth/register').send({ name: 'Dave', email: 'dave@test.dev', password: 'old-pass-123' })).body.data;
    const auth = { Authorization: 'Bearer ' + reg.token };
    const second = (await api.post('/api/auth/login').send({ email: 'dave@test.dev', password: 'old-pass-123' })).body.data;
    await api.post('/api/me/password').set(auth).send({ currentPassword: 'bad', newPassword: 'new-pass-1234' }).expect(403);
    await api.post('/api/me/password').set(auth).send({ currentPassword: 'old-pass-123', newPassword: 'old-pass-123' }).expect(400);
    await api.post('/api/me/password').set(auth).send({ currentPassword: 'old-pass-123', newPassword: 'new-pass-1234' }).expect(200);
    await api.get('/api/me').set({ Authorization: 'Bearer ' + second.token }).expect(401);
    await api.get('/api/me').set(auth).expect(200);
    await api.post('/api/auth/login').send({ email: 'dave@test.dev', password: 'old-pass-123' }).expect(401);
    await api.post('/api/auth/login').send({ email: 'dave@test.dev', password: 'new-pass-1234' }).expect(200);
    const exp = await api.get('/api/me/export').set(auth).expect(200);
    assert.equal(exp.body.data.profile.email, 'dave@test.dev'); assert.ok(!JSON.stringify(exp.body.data).includes('scrypt'));
    await api.delete('/api/me').set(auth).send({ password: 'wrong' }).expect(403);
    await api.delete('/api/me').set(auth).send({ password: 'new-pass-1234' }).expect(200);
    await api.get('/api/me').set(auth).expect(401);
    await api.post('/api/auth/login').send({ email: 'dave@test.dev', password: 'new-pass-1234' }).expect(401);
  } finally { await server.close(); }
});
