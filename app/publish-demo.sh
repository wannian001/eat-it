#!/bin/sh
# Copy the app into a checkout of the public demo repo (github.com/wannian001/eat-it, served by
# GitHub Pages at https://wannian001.github.io/eat-it/) and push it. Only the app and the stickers
# go there: no docs, no fieldwork material, no tests.
# Usage: sh app/publish-demo.sh <path to the eat-it checkout>
set -e
here=$(cd "$(dirname "$0")/.." && pwd)
dest=${1:?give the path to the eat-it checkout}
rm -rf "$dest/app" "$dest/assets"
mkdir -p "$dest/app" "$dest/assets/stickers"
cp -R "$here/app/index.html" "$here/app/styles.css" "$here/app/icon.svg" "$here/app/manifest.webmanifest" "$here/app/js" "$dest/app/"
cp "$here"/assets/stickers/*.svg "$dest/assets/stickers/"
cd "$dest"
git add -A
if git diff --cached --quiet; then echo "Nothing new to publish."; else git commit -q -m "Update the app from the group repo"; git push -q; fi
