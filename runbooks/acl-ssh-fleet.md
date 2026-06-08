# Runbook: ACL for SSH Fleet

Tailscale SSH policies for Devbox access.

## Where

[Tailscale Admin → Access controls](https://login.tailscale.com/admin/acls)

Template: `templates/acl-ssh-fleet.jsonc`

## Phase 1 — Members → members

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

On each host:

```bash
sudo tailscale set --ssh
```

## Phase 2 — Tagged fleet nodes

Replace `YOUR_GITHUB_LOGIN` in the ACL template, then:

```bash
sudo tailscale up --advertise-tags=tag:ssh-fleet
```

## Troubleshooting

```bash
tailscale debug prefs | grep -i ssh
ssh -v deploy@devbox-1
```