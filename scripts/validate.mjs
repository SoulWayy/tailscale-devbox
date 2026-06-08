#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'package.json',
  'LICENSE',
  'README.md',
  'brain/protocol.md',
  'brain/specialists.yaml',
  'scripts/bootstrap-ssh-node.sh',
  'scripts/init.mjs',
  'scripts/dispatch.mjs',
  'scripts/subagent.mjs',
  'scripts/session.mjs',
  'scripts/eval.mjs',
  'scripts/session-remote.sh',
  'subagents/code-repo/PROMPT.md',
  'skills/tailscale-devbox/SKILL.md',
  'templates/acl-ssh-fleet.jsonc',
  'runbooks/README.md',
  'runbooks/subagent-development.md',
];

let ok = true;
for (const f of required) {
  const p = join(ROOT, f);
  if (!existsSync(p)) {
    console.error(`MISSING: ${f}`);
    ok = false;
  }
}

const skill = await readFile(join(ROOT, 'skills/tailscale-devbox/SKILL.md'), 'utf8');
const banned = ['jan.tail', 'sofie', 'weg54', 'orgchefgroep', 'CHEF-', 'misterwanted'];
for (const b of banned) {
  if (skill.includes(b)) {
    console.error(`BANNED in skill: ${b}`);
    ok = false;
  }
}

if (ok) {
  console.log('OK: template structure valid, no personal references in skill');
  process.exit(0);
}
process.exit(1);