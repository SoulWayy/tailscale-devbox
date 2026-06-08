# Tailscale Devbox

**Agent Brain in the cloud → Linux execution on your tailnet via SSH.**

Like the Devin Brain/Devbox split, but with Tailscale instead of PrivateLink. No vendor lock-in, no public SSH — just MagicDNS + optional Tailscale SSH identity.

[![Use this template](https://img.shields.io/badge/Use%20this%20template-2ea44f?style=for-the-badge)](https://github.com/SoulWayy/tailscale-devbox/generate)

## Quick start (3 steps)

### 1. Create your copy

Click **Use this template** above, or:

```bash
gh repo create my-devbox-fleet --template SoulWayy/tailscale-devbox --public --clone
cd my-devbox-fleet
```

### 2. Configure (one command)

```bash
npm run init
```

Interactive prompts for your tailnet, primary/backup hosts, SSH user, and port.  
Non-interactive:

```bash
npm run init:quick -- --primary devbox-1 --backup devbox-2 --user deploy --tailnet mynet.ts.net --acl-owner you@github
```

Generates:

- `config.yaml` (gitignored — your fleet)
- `fleet/registry.yaml`
- `generated/ssh-config.snippet`

### 3. Bootstrap hosts + ACL

```bash
# On each Linux Devbox (after tailscale up):
bash scripts/bootstrap-ssh-node.sh --user deploy --port 22222

# Tailscale admin → paste templates/acl-ssh-fleet.jsonc (set tag owner)
# Workstation → append generated/ssh-config.snippet to ~/.ssh/config

ssh -p 22222 deploy@devbox-1.your-tailnet.ts.net
```

Optional Grok skill:

```bash
pwsh skills/install-skills.ps1   # Windows
bash skills/install-skills.sh    # Linux/macOS
```

## What's included

| Path | Purpose |
|------|---------|
| `scripts/init.mjs` | JS fleet config generator |
| `scripts/bootstrap-ssh-node.sh` | Tailnet-only OpenSSH + Tailscale SSH |
| `runbooks/` | Bootstrap, failover, dispatch, ACL |
| `skills/tailscale-devbox/` | Grok agent skill |
| `templates/` | ACL + SSH config examples |

## Architecture

```
Brain (your orchestrator)
  └── SSH → Devbox-1 (primary)
            Devbox-2 (backup)
                  tailnet only (100.x)
```

Closed loop: discovery → plan → execute → verify → eval → ship.

## Requirements

- [Tailscale](https://tailscale.com/) tailnet
- Linux Devbox host(s)
- Node.js 20+ (for `npm run init` only)
- SSH client

## Validate template

```bash
npm run validate
```

## License

MIT — see [LICENSE](LICENSE).

## Related

This is the **community template** (no personal hosts or org data).  
For a full production example with runbooks and internal fleet registry, see the private ops pattern in your own fork after `npm run init`.