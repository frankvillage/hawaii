#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="${PAGES_BUILD_WEB_DIR:-$ROOT_DIR/web}"
OUTPUT_DIR="${PAGES_BUILD_OUTPUT_DIR:-$ROOT_DIR/pages-preview/hawaii}"
NPM_BIN="${PAGES_BUILD_NPM:-npm}"
RSS_LIMIT_MB="${PAGES_BUILD_RSS_LIMIT_MB:-2048}"
RSS_HEADROOM_MB="${PAGES_BUILD_RSS_HEADROOM_MB:-256}"
RSS_POLL_SECONDS="${PAGES_BUILD_RSS_POLL_SECONDS:-0.1}"
TMP_ROOT=""
OUTPUT_PARENT="$(dirname "$OUTPUT_DIR")"
OUTPUT_NAME="$(basename "$OUTPUT_DIR")"
STAGE_DIR=""
BACKUP_DIR=""
ACTIVE_BUILD_PID=""
SWAP_STARTED=0
SWAP_COMPLETE=0
HAD_OUTPUT=0

process_tree_rows() {
  local root_pid="$1"

  ps -axo pid=,ppid=,rss= | awk -v root_pid="$root_pid" '
    {
      process_ids[NR] = $1
      parent[$1] = $2
      rss[$1] = $3
    }
    END {
      in_tree[root_pid] = 1
      depth[root_pid] = 0
      for (pass = 1; pass <= NR; pass++) {
        changed = 0
        for (row = 1; row <= NR; row++) {
          pid = process_ids[row]
          if (!in_tree[pid] && in_tree[parent[pid]]) {
            in_tree[pid] = 1
            depth[pid] = depth[parent[pid]] + 1
            if (depth[pid] > max_depth) max_depth = depth[pid]
            changed = 1
          }
        }
        if (!changed) break
      }
      for (current_depth = max_depth; current_depth >= 0; current_depth--) {
        for (row = 1; row <= NR; row++) {
          pid = process_ids[row]
          if (in_tree[pid] && depth[pid] == current_depth) print pid, rss[pid]
        }
      }
    }
  '
}

process_tree_rss_kb() {
  process_tree_rows "$1" | awk '{ total += $2 } END { print total + 0 }'
}

terminate_process_tree() {
  local root_pid="$1"
  local process_ids
  local attempt

  for attempt in 1 2 3; do
    process_ids="$(process_tree_rows "$root_pid" | awk '{ print $1 }')"
    if [[ -z "$process_ids" ]]; then
      return
    fi
    # Process IDs come only from ps; intentional splitting lets kill address the full tree.
    kill -TERM $process_ids 2>/dev/null || true
    sleep 0.1
  done

  process_ids="$(process_tree_rows "$root_pid" | awk '{ print $1 }')"
  if [[ -n "$process_ids" ]]; then
    kill -KILL $process_ids 2>/dev/null || true
  fi
}

cleanup() {
  local exit_status=$?

  trap - EXIT HUP INT TERM
  if [[ -n "$ACTIVE_BUILD_PID" ]] && kill -0 "$ACTIVE_BUILD_PID" 2>/dev/null; then
    terminate_process_tree "$ACTIVE_BUILD_PID"
    wait "$ACTIVE_BUILD_PID" 2>/dev/null || true
  fi

  if (( SWAP_STARTED == 1 && SWAP_COMPLETE == 0 )); then
    if (( HAD_OUTPUT == 1 )) && [[ -n "$BACKUP_DIR" && -e "$BACKUP_DIR" ]]; then
      rm -rf "$OUTPUT_DIR"
      if mv "$BACKUP_DIR" "$OUTPUT_DIR"; then
        BACKUP_DIR=""
      else
        echo "Could not restore previous Pages artifact from: $BACKUP_DIR" >&2
      fi
    elif (( HAD_OUTPUT == 0 )); then
      rm -rf "$OUTPUT_DIR"
    fi
  fi

  if [[ -n "$STAGE_DIR" ]]; then
    rm -rf "$STAGE_DIR"
  fi
  if (( SWAP_COMPLETE == 1 )) && [[ -n "$BACKUP_DIR" ]]; then
    rm -rf "$BACKUP_DIR"
  fi
  if [[ -n "$TMP_ROOT" ]]; then
    rm -rf "$TMP_ROOT"
  fi
  return "$exit_status"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

case "$RSS_LIMIT_MB" in
  ""|*[!0-9]*)
    echo "PAGES_BUILD_RSS_LIMIT_MB must be a positive integer" >&2
    exit 2
    ;;
esac
if (( RSS_LIMIT_MB < 1 )); then
  echo "PAGES_BUILD_RSS_LIMIT_MB must be at least 1" >&2
  exit 2
fi

case "$RSS_HEADROOM_MB" in
  ""|*[!0-9]*)
    echo "PAGES_BUILD_RSS_HEADROOM_MB must be a non-negative integer" >&2
    exit 2
    ;;
esac
if (( RSS_HEADROOM_MB >= RSS_LIMIT_MB )); then
  echo "PAGES_BUILD_RSS_HEADROOM_MB must be smaller than PAGES_BUILD_RSS_LIMIT_MB" >&2
  exit 2
fi

if ! [[ "$RSS_POLL_SECONDS" =~ ^([0-9]+([.][0-9]+)?|[.][0-9]+)$ ]] ||
  ! awk -v interval="$RSS_POLL_SECONDS" 'BEGIN { exit !(interval > 0) }'; then
  echo "PAGES_BUILD_RSS_POLL_SECONDS must be a positive decimal number" >&2
  exit 2
fi

RSS_TERMINATION_MB=$((RSS_LIMIT_MB - RSS_HEADROOM_MB))
RSS_TERMINATION_KB=$((RSS_TERMINATION_MB * 1024))
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/hawaii-pages.XXXXXX")"

if [[ ! -x "$WEB_DIR/node_modules/.bin/next" ]]; then
  echo "Missing web dependencies. Run: cd web && npm install" >&2
  exit 1
fi

mkdir -p "$TMP_ROOT/web" "$TMP_ROOT/shared"
rsync -a \
  --exclude node_modules \
  --exclude .next \
  --exclude out \
  --exclude src/app/api \
  "$WEB_DIR/" "$TMP_ROOT/web/"
rsync -a "$ROOT_DIR/shared/" "$TMP_ROOT/shared/"
ln -s "$WEB_DIR/node_modules" "$TMP_ROOT/web/node_modules"

(
  cd "$TMP_ROOT/web"
  STATIC_EXPORT=1 \
  NEXT_PUBLIC_BASE_PATH=/hawaii \
  NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--max-old-space-size=2048" \
  "$NPM_BIN" run build -- --webpack
) &
ACTIVE_BUILD_PID=$!

MEMORY_BREACH=0
while kill -0 "$ACTIVE_BUILD_PID" 2>/dev/null; do
  CURRENT_RSS_KB="$(process_tree_rss_kb "$ACTIVE_BUILD_PID")"
  if (( CURRENT_RSS_KB > RSS_TERMINATION_KB )); then
    echo "RSS safety threshold exceeded: ${CURRENT_RSS_KB}KB > ${RSS_TERMINATION_KB}KB (${RSS_LIMIT_MB}MB hard ceiling, ${RSS_HEADROOM_MB}MB headroom); terminating build process tree" >&2
    MEMORY_BREACH=1
    terminate_process_tree "$ACTIVE_BUILD_PID"
    break
  fi
  sleep "$RSS_POLL_SECONDS"
done

set +e
wait "$ACTIVE_BUILD_PID"
BUILD_STATUS=$?
set -e
ACTIVE_BUILD_PID=""

if (( MEMORY_BREACH == 1 )); then
  exit 137
fi
if (( BUILD_STATUS != 0 )); then
  exit "$BUILD_STATUS"
fi

find "$TMP_ROOT/web/out" -type f \( \
  -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.txt' \
\) -print0 | xargs -0 sed -i.bak \
  -e 's|"/media/|"/hawaii/media/|g' \
  -e "s|'/media/|'/hawaii/media/|g" \
  -e 's|(/media/|(/hawaii/media/|g'
find "$TMP_ROOT/web/out" -type f -name '*.bak' -delete

mkdir -p "$OUTPUT_PARENT"
STAGE_DIR="$(mktemp -d "$OUTPUT_PARENT/.${OUTPUT_NAME}.stage.XXXXXX")"
rsync -a --delete "$TMP_ROOT/web/out/" "$STAGE_DIR/"

SWAP_STARTED=1
if [[ -e "$OUTPUT_DIR" || -L "$OUTPUT_DIR" ]]; then
  HAD_OUTPUT=1
  BACKUP_DIR="$(mktemp -d "$OUTPUT_PARENT/.${OUTPUT_NAME}.backup.XXXXXX")"
  rmdir "$BACKUP_DIR"
  mv "$OUTPUT_DIR" "$BACKUP_DIR"
fi

if ! mv "$STAGE_DIR" "$OUTPUT_DIR"; then
  echo "Could not install the completed Pages artifact" >&2
  exit 1
fi
STAGE_DIR=""
SWAP_COMPLETE=1

if [[ -n "$BACKUP_DIR" ]]; then
  rm -rf "$BACKUP_DIR"
  BACKUP_DIR=""
fi

echo "GitHub Pages preview ready: $OUTPUT_DIR"
