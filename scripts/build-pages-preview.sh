#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"
OUTPUT_DIR="$ROOT_DIR/pages-preview/hawaii"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/hawaii-pages.XXXXXX")"

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

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
  NEXT_PUBLIC_BASE_PATH=/hawaii \
  NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--max-old-space-size=2048" \
  npm run build -- --webpack
)

find "$TMP_ROOT/web/out" -type f \( \
  -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.txt' \
\) -print0 | xargs -0 sed -i.bak \
  -e 's|"/media/|"/hawaii/media/|g' \
  -e "s|'/media/|'/hawaii/media/|g" \
  -e 's|(/media/|(/hawaii/media/|g'
find "$TMP_ROOT/web/out" -type f -name '*.bak' -delete

rsync -a --delete "$TMP_ROOT/web/out/" "$OUTPUT_DIR/"

echo "GitHub Pages preview ready: $OUTPUT_DIR"
