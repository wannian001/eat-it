#!/bin/sh
# Build the online demo (GitHub Pages) from this repo: only the app and the stickers, nothing else.
# app/publish-site.sh uses it to publish; run it yourself to preview the site:
#   sh app/build-site.sh /tmp/eat-it-site && python3 -m http.server 8000 --directory /tmp/eat-it-site
set -e
here=$(cd "$(dirname "$0")/.." && pwd)
dest=${1:?give an empty folder to build the site in}
mkdir -p "$dest"
dest=$(cd "$dest" && pwd)
case "$dest/" in "$here"/*) echo "Refusing: build outside this repo, not inside it." >&2; exit 1 ;; esac
rm -rf "$dest/app" "$dest/assets"
mkdir -p "$dest/app" "$dest/assets/stickers"
cp -R "$here/app/index.html" "$here/app/styles.css" "$here/app/icon.svg" "$here/app/manifest.webmanifest" "$here/app/js" "$dest/app/"
cp "$here"/assets/stickers/*.svg "$dest/assets/stickers/"
# Give the code a new address on every build (?v=<commit>). Otherwise phones keep running the old
# scripts from their cache after an update, because each module is cached on its own.
v=$(git -C "$here" rev-parse --short HEAD 2>/dev/null || date +%s)
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
touch "$dest/.nojekyll"
echo "Built $dest (v=$v)"
