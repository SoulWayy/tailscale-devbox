#!/usr/bin/env bash
# Runs ON the Devbox host — workspace + tmux session isolation per task_id.
set -euo pipefail

# Host-side secrets (fish loads via secrets.fish; bash -s needs explicit source)
if [[ -f "${HOME}/.openclaude/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "${HOME}/.openclaude/.env"
  set +a
fi

WORK_ROOT="${DEVBOX_WORK_ROOT:-${HOME}/.devbox/workspaces}"
SESSION_PREFIX="${DEVBOX_SESSION_PREFIX:-devbox}"

usage() {
  cat <<'EOF'
Usage: session-remote.sh <create|destroy|list|path> [task_id]

  create <task_id>   mkdir workspace + tmux session
  destroy <task_id>  kill tmux + remove workspace
  list               list active workspaces
  path <task_id>     print workspace path
EOF
}

cmd="${1:-}"
task_id="${2:-}"

mkdir -p "$WORK_ROOT"

case "$cmd" in
  create)
    [[ -n "$task_id" ]] || { echo "task_id required" >&2; exit 1; }
    ws="${WORK_ROOT}/${task_id}"
    mkdir -p "$ws"
    echo "{\"task_id\":\"${task_id}\",\"workspace\":\"${ws}\"}" > "${ws}/session.json"
    if command -v tmux >/dev/null 2>&1; then
      tmux has-session -t "${SESSION_PREFIX}-${task_id}" 2>/dev/null \
        || tmux new-session -d -s "${SESSION_PREFIX}-${task_id}" -c "$ws"
    fi
    echo "$ws"
    ;;
  destroy)
    [[ -n "$task_id" ]] || { echo "task_id required" >&2; exit 1; }
    if command -v tmux >/dev/null 2>&1; then
      tmux kill-session -t "${SESSION_PREFIX}-${task_id}" 2>/dev/null || true
    fi
    rm -rf "${WORK_ROOT}/${task_id}"
    echo "destroyed ${task_id}"
    ;;
  list)
    ls -1 "$WORK_ROOT" 2>/dev/null || true
    ;;
  path)
    [[ -n "$task_id" ]] || { echo "task_id required" >&2; exit 1; }
    echo "${WORK_ROOT}/${task_id}"
    ;;
  *)
    usage
    exit 1
    ;;
esac