# Runbook: Subagent Development

Build and run **Brain → specialist → subagent** loops on Tailscale Devboxes.

## Architecture

```
Brain (orchestrator)
  ├── infra-ssh specialist
  ├── code-repo specialist
  └── research-verify specialist
        └── subagent on Devbox (tmux + workspace)
              discovery → plan → execute → verify → eval
```

See `brain/protocol.md` and `brain/specialists.yaml`.

## Quick start

```bash
# 1. Dispatch task (creates remote workspace + task.json)
npm run dispatch -- --specialist code-repo --objective "clone repo and run tests"

# 2. Generate subagent spawn prompt (for Grok Task tool)
npm run subagent -- --task-id task-abc12345 --step discovery

# 3. After subagent writes step-result.json on Devbox:
npm run eval -- --task-id task-abc12345

# 4. Cleanup
npm run session -- destroy task-abc12345
```

## Specialists

| ID | Use for |
|----|---------|
| `infra-ssh` | Tailscale, SSH, sessions, host health |
| `code-repo` | Git, build, test, patches |
| `research-verify` | Read-only analysis, ship gates |

Prompts: `subagents/<id>/PROMPT.md`

## Session isolation

Each `task_id` gets:

- Directory: `~/.devbox/workspaces/<task_id>/`
- tmux session: `devbox-<task_id>`
- Artifacts: `task.json`, `step-result.json`, `plan.md`, logs

Remote script: `scripts/session-remote.sh`

## Closed loop rules

1. Max **3 iterations** per task
2. **Eval required** before next step (`npm run eval`)
3. Verdicts: `pass` | `retry` | `abort` | `handoff`
4. SSH only — no MCP execution path

## Grok / Cursor integration

1. Brain runs `npm run dispatch`
2. Brain spawns subagent with output of `npm run subagent` (spawn-prompt.md)
3. Subagent SSHs to Devbox (or runs in Devbox session) with specialist PROMPT
4. Brain runs `npm run eval` → next step or ship

## Offline development

If Devbox SSH is down, dispatch falls back to `.devbox-local/<task_id>/` for prompt iteration.

## Schemas

- `subagents/schemas/task.schema.json`
- `subagents/schemas/step-result.schema.json`