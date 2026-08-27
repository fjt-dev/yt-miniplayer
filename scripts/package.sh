#!/bin/sh

set -eu

repository_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
manifest_path="$repository_dir/manifest.json"

if ! jq -e 'type == "object" and .manifest_version == 3' "$manifest_path" >/dev/null; then
  echo "manifest.json is not valid JSON." >&2
  exit 1
fi

version=$(sed -nE 's/^[[:space:]]*"version":[[:space:]]*"([0-9.]+)",?$/\1/p' "$manifest_path")
case "$version" in
  ''|*[!0-9.]*)
    echo "Could not read a valid version from manifest.json." >&2
    exit 1
    ;;
esac

stage_dir=$(mktemp -d "${TMPDIR:-/tmp}/yt-tools-package.XXXXXX")
trap 'rm -rf "$stage_dir"' EXIT HUP INT TERM

mkdir -p "$stage_dir/icons" "$stage_dir/_locales/en" "$stage_dir/_locales/ja" "$repository_dir/dist"

for file in manifest.json content.js popup.html popup.css popup.js rules.json rules-playables.json; do
  cp "$repository_dir/$file" "$stage_dir/$file"
done

for file in icon16.png icon48.png icon128.png; do
  cp "$repository_dir/icons/$file" "$stage_dir/icons/$file"
done

cp "$repository_dir/_locales/en/messages.json" "$stage_dir/_locales/en/messages.json"
cp "$repository_dir/_locales/ja/messages.json" "$stage_dir/_locales/ja/messages.json"

archive_path="$repository_dir/dist/yt-tools-$version.zip"
rm -f "$archive_path"

(
  cd "$stage_dir"
  zip -X -q -r "$archive_path" .
)

if ! unzip -Z1 "$archive_path" | grep -qx 'manifest.json'; then
  echo "Package validation failed: manifest.json is not at the ZIP root." >&2
  exit 1
fi

echo "$archive_path"
