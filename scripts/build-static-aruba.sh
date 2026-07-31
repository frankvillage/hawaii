#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"
OUTPUT_PARENT="$ROOT_DIR/output"
OUTPUT_DIR="$OUTPUT_PARENT/aruba-static"
STAGED_OUTPUT="$OUTPUT_PARENT/.aruba-static.staging.$$"
PREVIOUS_OUTPUT="$OUTPUT_PARENT/.aruba-static.previous.$$"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/hawaii-aruba.XXXXXX")"

cleanup() {
  rm -rf "$TMP_ROOT" "$STAGED_OUTPUT"
  if [[ -d "$PREVIOUS_OUTPUT" ]]; then
    if [[ ! -e "$OUTPUT_DIR" ]]; then
      mv "$PREVIOUS_OUTPUT" "$OUTPUT_DIR" || true
    else
      rm -rf "$PREVIOUS_OUTPUT"
    fi
  fi
}
trap cleanup EXIT

if [[ ! -x "$WEB_DIR/node_modules/.bin/next" ]]; then
  echo "Missing web dependencies. Run: cd web && npm install" >&2
  exit 1
fi

COMMIT_SHA="$(git -C "$ROOT_DIR" rev-parse HEAD)"
if ! WORKTREE_STATUS="$(git -C "$ROOT_DIR" status --porcelain --untracked-files=normal)"; then
  echo "Unable to determine the source worktree state." >&2
  exit 1
fi
if [[ -n "$WORKTREE_STATUS" ]]; then
  WORKTREE_STATE="dirty"
else
  WORKTREE_STATE="clean"
fi
if [[ "${ARUBA_REQUIRE_CLEAN:-0}" == "1" && "$WORKTREE_STATE" != "clean" ]]; then
  echo "Refusing definitive Aruba build from a dirty worktree." >&2
  exit 1
fi

mkdir -p "$TMP_ROOT/web" "$TMP_ROOT/shared" "$OUTPUT_PARENT" "$STAGED_OUTPUT"
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
  NEXT_PUBLIC_BASE_PATH="" \
  NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}" \
  npm run build -- --webpack
)

rsync -a --delete "$TMP_ROOT/web/out/" "$STAGED_OUTPUT/"
cp "$ROOT_DIR/deploy/aruba/.htaccess.example" "$STAGED_OUTPUT/.htaccess"
printf 'commit=%s\nbuilt_at_utc=%s\nbase_path=root\nworktree=%s\n' \
  "$COMMIT_SHA" \
  "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  "$WORKTREE_STATE" \
  > "$STAGED_OUTPUT/RELEASE.txt"
node "$ROOT_DIR/tests/aruba-static-readiness.js" "$STAGED_OUTPUT"

if [[ -e "$OUTPUT_DIR" ]]; then
  mv "$OUTPUT_DIR" "$PREVIOUS_OUTPUT"
fi
if ! mv "$STAGED_OUTPUT" "$OUTPUT_DIR"; then
  if [[ -d "$PREVIOUS_OUTPUT" ]]; then
    mv "$PREVIOUS_OUTPUT" "$OUTPUT_DIR"
  fi
  exit 1
fi
rm -rf "$PREVIOUS_OUTPUT"

echo "Aruba static package ready: $OUTPUT_DIR"
