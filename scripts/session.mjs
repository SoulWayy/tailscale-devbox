#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { loadConfig, sshTarget, sshTransport } from '../lib/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [cmd, taskId, ...rest] = process.argv.slice(2);
const devbox = rest.includes('--devbox') ? rest[rest.indexOf('--devbox') + 1] : '';

if (!cmd || !['create', 'destroy', 'list', 'path'].includes(cmd)) {
  console.error('Usage: npm run session -- <create|destroy|list|path> [task_id] [--devbox host]');
  process.exit(1);
}

const config = await loadConfig(ROOT);
const target = sshTarget(config, devbox || config.primary_host);
const script = await readFile(join(ROOT, 'scripts/session-remote.sh'), 'utf8');

const remoteArgs = taskId ? `bash -s ${cmd} ${taskId}` : `bash -s ${cmd}`;
const { bin, args } = sshTransport(target, remoteArgs);
const child = spawn(bin, args, { stdio: ['pipe', 'pipe', 'inherit'] });
child.stdin.write(script);
child.stdin.end();
child.on('close', (code) => process.exit(code ?? 1));
child.on('error', (e) => { console.error(e); process.exit(1); });