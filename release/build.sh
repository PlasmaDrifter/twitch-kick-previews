#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

VERSION=$(grep -m1 '"version"' manifest.json | sed -E 's/.*"version": "([^"]+)".*/\1/')
ZIP_NAME="stream-previews-v${VERSION}.zip"
XPI_NAME="twitch-kick-previews.xpi"

# Remove prior zip archives to keep folder clean
rm -f stream-previews-v*.zip

# Package clean archive for AMO upload
zip -r -FS "$ZIP_NAME" manifest.json icons/ content/ popup/ background.js
cp "$ZIP_NAME" "$XPI_NAME"

echo "AMO Release Package ready: $DIR/$ZIP_NAME"
echo "Local XPI ready: $DIR/$XPI_NAME"
