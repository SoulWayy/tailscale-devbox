---
name: tailscale-devbox
description: >
  Tailscale SSH Devbox fleet — agent Brain dispatches work to tailnet Linux hosts via SSH.
  Covers bootstrap, failover, ACL, closed-loop dispatch, and runbooks. Generic template;
  activate on tailscale devbox, ssh fleet, devbox dispatch, brain devbox, agent execution
  nodes, or failover devbox. NOT for MCP-only routing.
license: MIT
compatibility: Requires tailscale CLI; SSH client; tailscale-devbox repo
metadata:
  version: "1.0.0"
---

# Tailscale Devbox Fleet

**Tailnet SSH nodes** for agent Brain execution. Your config lives in `config.yaml` and `fleet/registry.yaml`.

## Model

| Enterprise pattern | This template |
|--------------------|---------------|
| Cloud Brain | Your orchestrator (Grok, Claude, custom) |
| Isolated VM | Linux host on tailnet (SSH shell) |
| Private link | Tailscale mesh (100.x, MagicDNS) |
| WebSocket | SSH / Tailscale SSH |

## Setup

```bash
git clone https://github.com/SoulWayy/tailscale-devbox.git
cd tailscale-devbox
npm run init
```

## Subagent development

```bash
npm run dispatch -- --specialist code-repo --objective "run tests"
npm run subagent -- --task-id <id> --step discovery
npm run eval -- --task-id <id>
```

Protocol: `brain/protocol.md` · Specialists: `brain/specialists.yaml` · Runbook: `runbooks/subagent-development.md`

## Runbooks

| Runbook | Path |
|---------|------|
| Index | `runbooks/README.md` |
| Subagents | `runbooks/subagent-development.md` |
| Bootstrap | `runbooks/bootstrap-devbox-node.md` |
| Failover | `runbooks/failover-devbox.md` |
| Dispatch | `runbooks/brain-dispatch.md` |
| ACL | `runbooks/acl-ssh-fleet.md` |

## Closed loop

```
Brain → specialist → subagent on Devbox
  discovery → plan → execute → verify → eval → ship/iterate
```

Bounded steps. Eval after each step. Primary from `config.yaml` → `primary_host`.

## Quick commands

```bash
ssh -p 22222 deploy@devbox-1
tailscale ping devbox-1
bash scripts/bootstrap-ssh-node.sh --user deploy --port 22222
```

Install skill: `skills/install-skills.ps1` or `skills/install-skills.sh`