#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"
OUTPUT_DIR="$ROOT_DIR/output/aruba-static"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/hawaii-aruba.XXXXXX")"

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

if [[ ! -x "$WEB_DIR/node_modules/.bin/next" ]]; then
  echo "Missing web dependencies. Run: cd web && npm install" >&2
  exit 1
fi

mkdir -p "$TMP_ROOT/web" "$OUTPUT_DIR"
rsync -a \
  --exclude node_modules \
  --exclude .next \
  --exclude out \
  --exclude src/app/api \
  "$WEB_DIR/" "$TMP_ROOT/web/"
ln -s "$WEB_DIR/node_modules" "$TMP_ROOT/web/node_modules"

(
  cd "$TMP_ROOT/web"
  STATIC_EXPORT=1 \
  NEXT_PUBLIC_BASE_PATH="" \
  NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}" \
  npm run build -- --webpack
)

rsync -a --delete "$TMP_ROOT/web/out/" "$OUTPUT_DIR/"
cp "$ROOT_DIR/deploy/aruba/.htaccess.example" "$OUTPUT_DIR/.htaccess"
node "$ROOT_DIR/tests/aruba-static-readiness.js" "$OUTPUT_DIR"

echo "Aruba static package ready: $OUTPUT_DIR"
