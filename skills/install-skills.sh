#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DST="${HOME}/.grok/skills/tailscale-devbox"
mkdir -p "$DST"
cp -a "${SCRIPT_DIR}/tailscale-devbox/." "$DST/"
echo "==> Installed tailscale-devbox -> $DST"