import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
test('auth boundaries, atomic gift idempotency, owner seats, daily rewards and restart persistence',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'party-api-'));const file=join(dir,'state.json');const server=createApp({dataFile:file,demo:true});const api=request(server.app);
 try {
 assert.equal((await api.get('/api/me')).status,401);
 const register=async(name:string)=>{const r=await api.post('/api/auth/register').send({name,email:name+'@test.dev',password:'test-pass-123'});assert.equal(r.status,200);return r.body.data;};
 const a=await register('Alice');const b=await register('Bobby');const auth=(token:string)=>({Authorization:'Bearer '+token});
 assert.equal((await api.post('/api/auth/login').send({email:'Alice@test.dev',password:'wrong'})).status,401);
 const room=(await api.post('/api/rooms').set(auth(a.token)).send({title:'Test room'})).body.data;
 assert.equal((await api.get(`/api/rooms/${room.id}/messages`).set(auth(b.token))).status,403);
 await api.post(`/api/rooms/${room.id}/join`).set(auth(b.token)).send({}).expect(200);
 assert.equal((await api.post(`/api/rooms/${room.id}/seats/0`).set(auth(b.token)).send({action:'mute'})).status,403);
 await api.post(`/api/rooms/${room.id}/seats/1`).set(auth(b.token)).send({action:'take'}).expect(200);
 await api.post('/api/wallet/demo-credit').set(auth(a.token)).send({amount:100}).expect(200);
 const gift={recipientId:b.user.id,giftId:'rose',quantity:2,idempotencyKey:'same-key-123'};
 const first=await api.post('/api/gifts/send').set(auth(a.token)).send(gift);assert.equal(first.status,200);
 const repeated=await api.post('/api/gifts/send').set(auth(a.token)).send(gift);assert.equal(repeated.body.data.transaction.id,first.body.data.transaction.id);
 assert.equal((await api.get('/api/wallet').set(auth(a.token))).body.data.coins,80);
 assert.equal((await api.get('/api/wallet').set(auth(b.token))).body.data.diamonds,20);
 await api.post('/api/gifts/send').set(auth(a.token)).send({...gift,quantity:3}).expect(409);
 await api.post('/api/gifts/send').set(auth(a.token)).send({...gift,quantity:100,idempotencyKey:'insufficient-key'}).expect(409);
 assert.equal((await api.get('/api/wallet').set(auth(a.token))).body.data.coins,80);
 await api.post('/api/tasks/daily-login/claim').set(auth(a.token)).send({}).expect(200);await api.post('/api/tasks/daily-login/claim').set(auth(a.token)).send({}).expect(409);
 await api.get('/api/admin/reports').set(auth(a.token)).expect(403);
 await api.post(`/api/rooms/${room.id}/rtc-token`).set(auth(a.token)).send({}).expect(503);
 await api.post(`/api/users/${b.user.id}/messages`).set(auth(a.token)).send({text:'Private hello'}).expect(200);
 const c=await register('Carol');assert.equal((await api.get(`/api/users/${b.user.id}/messages`).set(auth(c.token))).body.data.length,0);
 const game=(await api.post('/api/games').set(auth(a.token)).send({roomId:room.id})).body.data;
 await api.post(`/api/games/${game.id}/join`).set(auth(b.token)).send({}).expect(200);
 await api.post(`/api/games/${game.id}/move`).set(auth(b.token)).send({index:0}).expect(409);
 await api.post(`/api/games/${game.id}/move`).set(auth(a.token)).send({index:0}).expect(200);
 await api.post(`/api/games/${game.id}/move`).set(auth(b.token)).send({index:0}).expect(409);
 await api.post(`/api/rooms/${room.id}/pk`).set(auth(b.token)).send({opponentId:a.user.id}).expect(403);
 await api.post(`/api/rooms/${room.id}/pk`).set(auth(a.token)).send({opponentId:b.user.id}).expect(200);
 const admin=(await api.post('/api/auth/admin-demo').send({})).body.data;
 await api.patch(`/api/admin/users/${c.user.id}`).set(auth(admin.token)).send({disabled:true}).expect(200);
 await api.get('/api/me').set(auth(c.token)).expect(401);
 await api.post('/api/auth/login').send({email:'Carol@test.dev',password:'test-pass-123'}).expect(401);
 const restarted=createApp({dataFile:file,demo:false});try{const restored=await request(restarted.app).get('/api/me').set(auth(a.token));assert.equal(restored.body.data.coins,100);await request(restarted.app).post('/api/auth/demo').send({}).expect(403);}finally{await restarted.close();}
 }finally{await server.close();rmSync(dir,{recursive:true,force:true});}
});

