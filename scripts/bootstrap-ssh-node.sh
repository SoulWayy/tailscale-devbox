#!/usr/bin/env bash
# Bootstrap a Linux host as a general Tailscale SSH node (not MCP/OpenCode).
set -euo pipefail

SSH_USER="${SSH_USER:-$(whoami)}"
SSH_PORT="${SSH_PORT:-22222}"
ENABLE_TS_SSH="${ENABLE_TS_SSH:-1}"
BIND_TAILSCALE_ONLY="${BIND_TAILSCALE_ONLY:-1}"

usage() {
  cat <<'EOF'
Usage: bootstrap-ssh-node.sh [options]

  --user USER           Primary SSH login user (default: current)
  --port PORT           OpenSSH port on Tailscale IP (default: 22222)
  --enable-ts-ssh       Run: tailscale set --ssh (default: yes)
  --no-enable-ts-ssh    Skip Tailscale SSH; OpenSSH only
  --help

Result: SSH reachable only via tailnet (100.x), MagicDNS hostname.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --user) SSH_USER="$2"; shift 2 ;;
    --port) SSH_PORT="$2"; shift 2 ;;
    --enable-ts-ssh) ENABLE_TS_SSH=1; shift ;;
    --no-enable-ts-ssh) ENABLE_TS_SSH=0; shift ;;
    --help) usage; exit 0 ;;
    *) echo "Unknown: $1" >&2; usage; exit 1 ;;
  esac
done

if ! command -v tailscale >/dev/null 2>&1; then
  echo "ERROR: tailscale not installed" >&2
  exit 1
fi

TS_IP="$(tailscale ip -4 2>/dev/null || true)"
FQDN="$(tailscale status --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('Self',{}).get('DNSName') or '').rstrip('.'))" 2>/dev/null || echo "")"

if [[ -z "$TS_IP" ]]; then
  echo "ERROR: not connected to tailnet" >&2
  exit 1
fi

echo "==> Tailscale SSH node bootstrap"
echo "    FQDN: ${FQDN:-unknown}"
echo "    IP:   $TS_IP"
echo "    User: $SSH_USER"
echo "    Port: $SSH_PORT"

# --- OpenSSH: bind tailscale IP only ---
DROPIN="/etc/ssh/sshd_config.d/99-tailscale-ssh-node.conf"
sudo tee "$DROPIN" >/dev/null <<EOF
# Managed by tailscale-ssh-fleet bootstrap
ListenAddress ${TS_IP}
Port ${SSH_PORT}
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
EOF

sudo sshd -t
sudo systemctl reload sshd 2>/dev/null || sudo systemctl reload ssh 2>/dev/null || sudo systemctl restart sshd

# --- Tailscale SSH (port 22 on tailnet IP) ---
if [[ "$ENABLE_TS_SSH" == "1" ]]; then
  echo "==> Enabling Tailscale SSH (tailscale set --ssh)"
  sudo tailscale set --ssh
fi

# --- linger for user services if needed ---
if command -v loginctl >/dev/null 2>&1; then
  sudo loginctl enable-linger "$SSH_USER" 2>/dev/null || true
fi

echo "==> Done"
echo "    OpenSSH:  ssh -p ${SSH_PORT} ${SSH_USER}@${FQDN:-$TS_IP}"
if [[ "$ENABLE_TS_SSH" == "1" ]]; then
  echo "    TS SSH:   ssh ${SSH_USER}@${FQDN:-hostname}"
fi
echo "    Verify:   tailscale status --self"