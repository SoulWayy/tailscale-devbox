# Runbook: Bootstrap Devbox Node

Add a Linux host as a general Tailscale SSH Devbox.

## Prerequisites

- Host joined tailnet (`tailscale up`)
- Sudo on host
- Your SSH public key in `~/.ssh/authorized_keys`

## Steps

### 1. Run bootstrap

```bash
bash scripts/bootstrap-ssh-node.sh --user deploy --port 22222 --enable-tailscale-ssh
```

### 2. Verify tailnet-only bind

```bash
tailscale ip -4
sudo ss -tlnp | grep sshd
tailscale status --self
```

### 3. ACL

See [acl-ssh-fleet.md](acl-ssh-fleet.md). Minimum:

```json
"ssh": [
  {
    "action": "accept",
    "src": ["autogroup:member"],
    "dst": ["autogroup:member"],
    "users": ["autogroup:nonroot", "root"]
  }
]
```

### 4. Client SSH config

```bash
npm run init   # generates generated/ssh-config.snippet
```

Append to `~/.ssh/config`.

### 5. Test

```bash
ssh -p 22222 deploy@devbox-1.your-tailnet.ts.net
ssh deploy@devbox-1   # after tailscale set --ssh + ACL
```

### 6. Update registry

Edit `fleet/registry.yaml` or re-run `npm run init`.

## Do not

- Expose SSH via public Funnel
- Use MCP SSE as primary Devbox access (keep SSH separate)

## Rollback

```bash
sudo rm /etc/ssh/sshd_config.d/99-tailscale-ssh-node.conf
sudo systemctl reload sshd
sudo tailscale set --ssh=false
```