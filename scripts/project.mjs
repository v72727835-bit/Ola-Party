import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
const apps = ['api', 'mobile', 'admin'];
const children = new Set();
const npm = process.env.npm_execpath;
if (!npm || !existsSync(npm)) throw new Error('Run this command through npm, e.g. npm run dev.');

function run(app, args) {
  console.log(`\n[${app}] npm ${args.join(' ')}`);
  const child = spawn(process.execPath, [npm, ...args], {
    cwd: resolve(root, 'apps', app), stdio: 'inherit', env: process.env,
    windowsHide: true,
  });
  children.add(child);
  return new Promise((resolvePromise, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      children.delete(child);
      if (code === 0) resolvePromise();
      else reject(new Error(`${app} exited ${code ?? signal}`));
    });
  });
}

function stop() {
  for (const child of children) {
    if (process.platform === 'win32' && child.pid) {
      spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
    } else child.kill('SIGTERM');
  }
}
process.on('SIGINT', () => { stop(); process.exitCode = 130; });
process.on('SIGTERM', () => { stop(); process.exitCode = 143; });
try {
  if (mode === 'dev') {
    await Promise.all([run('api', ['run', 'dev']), run('mobile', ['run', 'web']), run('admin', ['run', 'dev'])]);
  } else if (mode === 'install') {
    for (const app of apps) await run(app, ['install']);
  } else if (mode === 'check') {
    for (const app of apps) await run(app, ['run', 'check']);
  } else if (mode === 'build') {
    await run('api', ['run', 'build']);
    await run('mobile', ['run', 'build:web']);
    await run('admin', ['run', 'build']);
  } else throw new Error('Expected install, dev, check or build.');
} catch (error) {
  console.error(error.message);
  stop();
  process.exitCode = 1;
}
