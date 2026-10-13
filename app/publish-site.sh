#!/bin/sh
# Publish the online demo from this repo: build the site (app/ + stickers only, see build-site.sh)
# and push it to this repo's gh-pages branch, which GitHub Pages serves at
# https://wannian001.github.io/eat-it/. Run it from main after merging:  sh app/publish-site.sh
set -e
here=$(cd "$(dirname "$0")/.." && pwd)
[ -z "$(git -C "$here" status --porcelain -- app assets)" ] || { echo "Commit your changes in app/ and assets/ first." >&2; exit 1; }
origin=$(git -C "$here" remote get-url origin)
v=$(git -C "$here" rev-parse --short HEAD)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
sh "$here/app/build-site.sh" "$tmp/site" >/dev/null
cd "$tmp/site"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$here" config user.name)" -c user.email="$(git -C "$here" config user.email)" commit -q -m "Demo built from $v"
# gh-pages only ever holds the latest build, so it is replaced each time.
git push -q -f "$origin" gh-pages
echo "Published $v to gh-pages."
