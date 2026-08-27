#!/bin/sh

set -eu

repository_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
chrome_binary="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
template_url="file://$repository_dir/scripts/store-assets.html"

if [ ! -x "$chrome_binary" ]; then
  echo "Google Chrome was not found at the expected macOS path." >&2
  exit 1
fi

mkdir -p "$repository_dir/store-assets"

profile_dir=$(mktemp -d "${TMPDIR:-/tmp}/yt-tools-assets.XXXXXX")
trap 'rm -rf "$profile_dir"' EXIT HUP INT TERM

"$chrome_binary" --headless --disable-gpu --hide-scrollbars \
  --user-data-dir="$profile_dir" --window-size=1280,800 \
  --screenshot="$repository_dir/store-assets/screenshot-1.png" \
  "$template_url?asset=screenshot" >/dev/null 2>&1

"$chrome_binary" --headless --disable-gpu --hide-scrollbars \
  --user-data-dir="$profile_dir" --window-size=440,280 \
  --screenshot="$repository_dir/store-assets/small-promo.png" \
  "$template_url?asset=promo" >/dev/null 2>&1

echo "$repository_dir/store-assets"
