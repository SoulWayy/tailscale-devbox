# AGENTS.md — Tailscale Devbox

## Project

Tailnet SSH Devbox fleet for agent Brain execution. Community template — no org-specific hosts.

## Key paths

- `scripts/init.mjs` — fleet config generator (Node 20+)
- `scripts/bootstrap-ssh-node.sh` — host bootstrap
- `fleet/registry.yaml` — generated node registry (gitignored source: run init)
- `runbooks/` — operational guides
- `skills/tailscale-devbox/SKILL.md` — Grok skill

## Conventions

- Devbox access = SSH only (not MCP SSE as primary path)
- OpenSSH binds tailnet IP (100.x) only
- `config.yaml` is local/gitignored — never commit real fleet data to the template upstream
- Keep community repo free of personal hostnames, tailnet IDs, or internal issue keys

## Commands

```bash
npm run init
npm run validate
bash scripts/bootstrap-ssh-node.sh --user deploy --port 22222
```