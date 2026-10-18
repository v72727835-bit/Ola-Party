import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
test('admin actions are written to the audit log', async () => {
  const server = createApp({ dataFile: join(mkdtempSync(join(tmpdir(), 'party-audit-')), 'state.json'), demo: true }); const api = request(server.app);
  try {
    const admin = (await api.post('/api/auth/admin-demo').send({})).body.data; const A = { Authorization: 'Bearer ' + admin.token };
    const user = (await api.post('/api/auth/register').send({ name: 'Erin', email: 'erin@test.dev', password: 'erin-pass-123' })).body.data;
    await api.get('/api/admin/audit').set({ Authorization: 'Bearer ' + user.token }).expect(403);
    assert.equal((await api.get('/api/admin/audit').set(A)).body.data.length, 0);
    await api.patch('/api/admin/users/' + user.user.id).set(A).send({ disabled: true }).expect(200);
    await api.patch('/api/admin/users/' + user.user.id).set(A).send({ disabled: false }).expect(200);
    const log = (await api.get('/api/admin/audit').set(A)).body.data;
    assert.deepEqual(log.map((x: any) => x.action), ['user.restore', 'user.disable']);
    assert.equal(log[0].targetId, user.user.id); assert.equal(log[0].adminId, admin.user.id);
  } finally { await server.close(); }
});
