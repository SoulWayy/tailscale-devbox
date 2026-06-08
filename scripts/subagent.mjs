#!/usr/bin/env node
/**
 * Build subagent spawn prompt for Brain (Grok Task tool / manual).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function getArg(name, fallback = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const taskId = getArg('--task-id', '');
const step = getArg('--step', '');

if (!taskId) {
  console.error('Usage: npm run subagent -- --task-id <id> [--step discovery]');
  process.exit(1);
}

const localTask = join(ROOT, '.devbox-local', taskId, 'task.json');
if (!existsSync(localTask)) {
  console.error(`ERROR: missing ${localTask} — run dispatch first`);
  process.exit(1);
}

const task = JSON.parse(await readFile(localTask, 'utf8'));
const specialist = task.specialist;
const currentStep = step || task.step;
const promptPath = join(ROOT, 'subagents', specialist, 'PROMPT.md');
const specialistPrompt = await readFile(promptPath, 'utf8');

const spawnPrompt = `# Subagent spawn — ${specialist} / ${currentStep}

## Task (task.json)
\`\`\`json
${JSON.stringify({ ...task, step: currentStep }, null, 2)}
\`\`\`

## Specialist instructions
${specialistPrompt}

## Execution contract
1. Work only in workspace: \`${task.workspace}\`
2. Complete step: **${currentStep}**
3. Write \`step-result.json\` to workspace
4. Set verdict: pass | retry | abort | handoff
5. Iteration ${task.iteration}/${task.max_iterations} — do not exceed

## After completion
Brain runs: \`npm run eval -- --task-id ${taskId}\`
`;

const outPath = join(ROOT, '.devbox-local', taskId, 'spawn-prompt.md');
await writeFile(outPath, spawnPrompt);

console.log(spawnPrompt);
console.log('\n==> Saved:', outPath);
console.log('==> Use this prompt with Grok Task / subagent tool, or paste to Devbox agent session.');