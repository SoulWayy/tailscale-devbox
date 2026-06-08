#!/usr/bin/env node
/**
 * Evaluate step-result.json — gate for closed loop.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, sshTarget } from '../lib/config.mjs';
import { runSsh } from '../lib/ssh.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const taskId = process.argv[process.argv.indexOf('--task-id') + 1];

if (!taskId) {
  console.error('Usage: npm run eval -- --task-id <id>');
  process.exit(1);
}

const localDir = join(ROOT, '.devbox-local', taskId);
const localResult = join(localDir, 'step-result.json');
let result;

if (existsSync(localResult)) {
  result = JSON.parse(await readFile(localResult, 'utf8'));
} else {
  const task = JSON.parse(await readFile(join(localDir, 'task.json'), 'utf8'));
  const config = await loadConfig(ROOT);
  const target = sshTarget(config, task.devbox);
  const remote = await runSsh(target, `cat '${task.workspace}/step-result.json' 2>/dev/null || echo '{}'`);
  try {
    result = JSON.parse(remote.stdout || '{}');
  } catch {
    result = { verdict: 'pending', eval_notes: 'no step-result.json yet' };
  }
}

const verdict = result.verdict || 'pending';
const loop = {
  task_id: taskId,
  verdict,
  exit_code: result.exit_code ?? null,
  next_step: result.next_step ?? null,
  eval_notes: result.eval_notes ?? '',
  action: {
    pass: 'Proceed to next step or ship',
    retry: `Re-dispatch with --iteration +1 and narrower objective`,
    abort: 'npm run session -- destroy ' + taskId,
    handoff: 'Switch specialist in new dispatch',
    pending: 'Subagent has not finished — check workspace',
  }[verdict] || 'unknown',
};

console.log(JSON.stringify(loop, null, 2));

if (verdict === 'abort') process.exit(2);
if (verdict === 'retry') process.exit(1);
process.exit(0);