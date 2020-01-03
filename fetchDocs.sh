#!/bin/sh

# This script, when started by npm, runs in the root dir of the project.
# So ./ is the project dir no matter where the script lives.

SRCDIR="https://raw.githubusercontent.com/RolandJansen/intermix.js/master"
OUTDIR="./docs"

# create OUTDIR if needed
if [ ! -d  "$OUTDIR" ]; then
    mkdir "$OUTDIR"
fi

echo "Copying files from master ..."
curl $SRCDIR/README.md --output $OUTDIR/README.md
curl $SRCDIR/CHANGELOG.md --output $OUTDIR/CHANGELOG.md

echo ""

echo "Copying markdown from wiki ..."
curl $SRCDIR/Getting-Started.md --output $OUTDIR/Getting-Started.md
