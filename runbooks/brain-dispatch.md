# Runbook: Brain → Devbox Dispatch

Cloud orchestrator sends work to a tailnet Devbox via SSH.

## Closed loop

```
ORCHESTRATOR
  → specialist (infra / code / research)
    → subagent on Devbox
      → discovery → plan → execute → verify → eval
        → ship or iterate (bounded)
```

Eval after each step. No unbounded retry loops.

## Protocol

### 1. Pick Devbox

Read `config.yaml` → `primary_host`. Failover: [failover-devbox.md](failover-devbox.md).

### 2. Execute via SSH

```bash
ssh -p 22222 deploy@devbox-1 "cd ~/project && git pull && make test"
ssh -p 22222 deploy@devbox-1 'bash -s' < ./scripts/my-task.sh
```

### 3. Verify

```bash
ssh -p 22222 deploy@devbox-1 "test -f ./artifact && echo OK || echo FAIL"
```

### 4. Persist context

Record `ACTIVE_DEVBOX`, `WORK_DIR`, `BRANCH`, `LAST_EXIT_CODE` for the next session.

## Security

- Tailnet only — no public SSH
- SSH keys or Tailscale SSH identity
- Secrets on host in `.env` with chmod 600