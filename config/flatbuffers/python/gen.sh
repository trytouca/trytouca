#!/usr/bin/env bash

set -o errexit -o pipefail -o noclobber -o nounset

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FBS_FILE="$(dirname "${PACKAGE_DIR}")/touca.fbs"
FBS_OUTPUT_DIR="${PACKAGE_DIR}/temp"
FBS_OUTPUT_FILE="${PACKAGE_DIR}/touca_fbs/__init__.py"

rm -rf "$FBS_OUTPUT_DIR"
flatc --gen-onefile --gen-object-api --python -o "$FBS_OUTPUT_DIR" "$FBS_FILE"
mkdir -p "$(dirname "$FBS_OUTPUT_FILE")"
mv "$FBS_OUTPUT_DIR/touca_generated.py" "$FBS_OUTPUT_FILE"
rm -rf "$FBS_OUTPUT_DIR"
sed -i .bak '/# namespace/d' "$FBS_OUTPUT_FILE"
sed -i .bak '/from touca.* import /d' "$FBS_OUTPUT_FILE"
rm "$FBS_OUTPUT_FILE.bak"
black -q "$FBS_OUTPUT_FILE"
