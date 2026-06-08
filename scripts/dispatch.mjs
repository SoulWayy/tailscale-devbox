#!/usr/bin/env node
/**
 * Brain dispatch — create Devbox workspace + task.json for subagent.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { loadConfig, sshTarget, sshTransport, devboxHosts } from '../lib/config.mjs';
import { runSsh } from '../lib/ssh.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function getArg(name, fallback = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

async function runRemoteSession(target, subcmd, taskId) {
  const script = await readFile(join(ROOT, 'scripts/session-remote.sh'), 'utf8');
  return new Promise((resolve, reject) => {
    const { bin, args } = sshTransport(target, `bash -s ${subcmd} ${taskId}`);
    const child = spawn(bin, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.stdin.write(script);
    child.stdin.end();
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(err || `remote session ${subcmd} failed (${code})`));
      else resolve(out.trim().split('\n').filter(Boolean).pop());
    });
    child.on('error', reject);
  });
}

const specialist = getArg('--specialist', 'code-repo');
const step = getArg('--step', 'discovery');
const objective = getArg('--objective', '');
const taskId = getArg('--task-id', `task-${randomUUID().slice(0, 8)}`);
const devbox = getArg('--devbox', '');
const noFailover = args.includes('--no-failover');
const iteration = Number(getArg('--iteration', '1'));

if (!objective) {
  console.error('Usage: npm run dispatch -- --specialist code-repo --objective "..." [--step discovery] [--devbox host]');
  process.exit(1);
}

const config = await loadConfig(ROOT);
const hostQueue = noFailover || devbox
  ? devboxHosts(config, devbox || config.primary_host)
  : devboxHosts(config, '');

let target;
let workspace;
let offline = false;
let failedOver = false;

for (let i = 0; i < hostQueue.length; i++) {
  target = sshTarget(config, hostQueue[i]);
  if (i === 0) {
    console.log(`==> Dispatch to ${target.fqdn}`);
  } else {
    failedOver = true;
    console.log(`==> Failover: trying ${target.fqdn}`);
  }
  console.log(`    specialist: ${specialist} | step: ${step} | task_id: ${taskId}`);
  try {
    workspace = await runRemoteSession(target, 'create', taskId);
    break;
  } catch (e) {
    console.warn(`WARN: ${target.fqdn} unavailable: ${e.message}`);
    if (i === hostQueue.length - 1) {
      offline = true;
      workspace = join(ROOT, '.devbox-local', taskId);
      await mkdir(workspace, { recursive: true });
      console.warn('WARN: all Devbox hosts failed — local workspace:', workspace);
    }
  }
}

const task = {
  task_id: taskId,
  specialist,
  step,
  objective,
  devbox: target.host,
  workspace,
  failed_over: failedOver,
  iteration,
  max_iterations: 3,
  context: {},
  created_at: new Date().toISOString(),
};

const localMirror = join(ROOT, '.devbox-local', taskId);
await mkdir(localMirror, { recursive: true });
await writeFile(join(localMirror, 'task.json'), JSON.stringify(task, null, 2));

if (!offline) {
  const payload = JSON.stringify(task);
  const upload = await runSsh(
    target,
    `mkdir -p '${workspace}' && printf '%s' '${payload.replace(/'/g, "'\\''")}' > '${workspace}/task.json'`,
  );
  if (upload.code !== 0) console.warn('WARN: task.json remote write issue:', upload.stderr);
}

const packet = {
  type: 'subagent_spawn',
  task_id: taskId,
  specialist,
  step,
  devbox: target.fqdn,
  workspace,
  prompt_file: `subagents/${specialist}/PROMPT.md`,
  task_file: `${workspace}/task.json`,
  spawn_instruction: `Load PROMPT.md + task.json. Run step "${step}". Write step-result.json. Bounded loop.`,
  next_command: `npm run subagent -- --task-id ${taskId} --step ${step}`,
};

console.log('\n==> Dispatch packet:\n');
console.log(JSON.stringify(packet, null, 2));
console.log('\n==> Next: npm run subagent -- --task-id', taskId);