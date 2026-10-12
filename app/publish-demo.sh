#!/bin/sh
# Copy the app into a checkout of the public demo repo (github.com/wannian001/eat-it, served by
# GitHub Pages at https://wannian001.github.io/eat-it/) and push it. Only the app and the stickers
# go there: no docs, no fieldwork material, no tests.
# Usage: sh app/publish-demo.sh <path to the eat-it checkout>
set -e
here=$(cd "$(dirname "$0")/.." && pwd)
dest=${1:?give the path to the eat-it checkout}
dest=$(cd "$dest" && pwd)
# Safety: only ever write into a separate checkout of the eat-it repo, and only publish committed code
# (the ?v= stamp below is the commit, so uncommitted edits would go out under an old version).
case "$dest/" in "$here"/*) echo "Refusing: $dest is inside this repo." >&2; exit 1 ;; esac
git -C "$dest" remote get-url origin 2>/dev/null | grep -q 'wannian001/eat-it' || { echo "Refusing: $dest is not a checkout of wannian001/eat-it." >&2; exit 1; }
[ -z "$(git -C "$here" status --porcelain -- app assets)" ] || { echo "Commit your changes in app/ and assets/ first." >&2; exit 1; }
rm -rf "$dest/app" "$dest/assets"
mkdir -p "$dest/app" "$dest/assets/stickers"
cp -R "$here/app/index.html" "$here/app/styles.css" "$here/app/icon.svg" "$here/app/manifest.webmanifest" "$here/app/js" "$dest/app/"
cp "$here"/assets/stickers/*.svg "$dest/assets/stickers/"
# Give the code a new address on every publish (?v=<commit>). Otherwise phones keep running the old
# scripts from their cache after an update, because each module is cached on its own.
v=$(cd "$here" && git rev-parse --short HEAD)
find "$dest/app/js" -name '*.js' -exec sed -i.bak -E "s#(from '\.{1,2}/[^']+\.js)'#\1?v=$v'#g" {} \;
sed -i.bak -e "s#src=\"js/main.js\"#src=\"js/main.js?v=$v\"#" -e "s#href=\"styles.css\"#href=\"styles.css?v=$v\"#" "$dest/app/index.html"
find "$dest/app" -name '*.bak' -delete
# The site root sends people on to the app, keeping ?user=… and #week.
cat > "$dest/index.html" <<'HTML'
<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Eat It!</title>
  <link rel="icon" href="app/icon.svg" type="image/svg+xml">
  <script>location.replace('app/' + location.search + location.hash);</script>
  <noscript><meta http-equiv="refresh" content="0; url=app/"></noscript>
</head>
<body>
  <p><a href="app/">Open Eat It!</a></p>
</body>
</html>
HTML
cd "$dest"
git add -A
if git diff --cached --quiet; then echo "Nothing new to publish."; else git commit -q -m "Update the app from the group repo"; git push -q; fi
