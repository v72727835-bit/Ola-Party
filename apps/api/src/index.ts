import 'dotenv/config';
import { createApp } from './app.js';
const server=createApp();
const port=Number(process.env.PORT||4000);
server.http.listen(port,process.env.HOST||'0.0.0.0',()=>console.log(`Party API listening on ${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close().then(()=>process.exit(0)));
