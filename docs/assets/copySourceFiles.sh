#!/bin/sh

# This script, when started by npm, runs in the root dir of the project.
# So ./ is the project dir no matter where the lives.

echo "Copying files from repo root ..."
cp -v ./README.md ./docs/_includes/
cp -v ./CHANGELOG.md ./docs/_includes/

echo ""

echo "Copying markdown from wiki ..."
curl https://raw.githubusercontent.com/wiki/RolandJansen/intermix.js/Getting-Started.md --output ./docs/_includes/Getting-Started.md
