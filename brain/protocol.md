# Brain ↔ Devbox Protocol

Version 1.0 — SSH only (no MCP transport for execution).

## Roles

| Role | Where | Responsibility |
|------|-------|----------------|
| **Brain** | Cloud orchestrator | Route task → specialist → subagent; eval each step |
| **Specialist** | Brain-side persona | Pick loop step, scope tools, spawn subagent |
| **Subagent** | Devbox via SSH | Run discovery/plan/execute/verify in workspace |
| **Devbox** | Tailnet Linux host | tmux session + isolated workspace dir |

## Message flow

```
Brain
  │ 1. dispatch (npm run dispatch)
  ▼
Devbox workspace created (tmux + ~/.devbox/workspaces/<task_id>/)
  │ 2. spawn packet (npm run subagent)
  ▼
Subagent prompt = specialist PROMPT.md + task.json
  │ 3. step execution (SSH commands / agent on Devbox)
  ▼
step-result.json written to workspace
  │ 4. eval (npm run eval)
  ▼
verdict: pass | retry | abort | handoff
```

## Task artifact

`task.json` in workspace — see `subagents/schemas/task.schema.json`.

## Step result

`step-result.json` — see `subagents/schemas/step-result.schema.json`.

## Closed loop rules

1. **Bounded:** max 3 iterations per task (configurable)
2. **Eval gate:** no step N+1 until step N eval = `pass` or `handoff`
3. **Session isolation:** one tmux session per `task_id`
4. **Failover:** if Devbox unreachable, Brain switches host before retry (see failover runbook)

## vs Devin

| Devin | This protocol |
|-------|---------------|
| WebSocket Brain↔Devbox | SSH + JSON artifacts in workspace |
| Cognition-managed VM | Your tailnet Linux host |
| Opaque session | `task.json` + `step-result.json` on disk |

## CLI

```bash
npm run dispatch -- --specialist code-repo --objective "run tests"
npm run subagent -- --task-id <id> --step discovery
npm run session -- list
npm run eval -- --task-id <id>
```