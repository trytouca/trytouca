#!/usr/bin/env bash
# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

set -o errexit -o pipefail -o noclobber -o nounset

THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FBS_FILE="$(dirname "${THIS_DIR}")/touca.fbs"
FBS_OUTPUT_DIR="${THIS_DIR}/temp"
FBS_OUTPUT_FILE="${THIS_DIR}/touca_fbs/__init__.py"

if [[ $(uname -s) == Linux* ]]; then
  rm -rf "$FBS_OUTPUT_DIR"
  if ! command -v "flatc" >/dev/null 2>&1; then
    curl -L "https://github.com/google/flatbuffers/releases/download/v22.12.06/Linux.flatc.binary.g++-10.zip" -o flatc.zip
    unzip flatc.zip -d "/usr/local/bin"
  fi
  flatc --gen-onefile --gen-object-api --python -o "$FBS_OUTPUT_DIR" "$FBS_FILE"
  mkdir -p "$(dirname "$FBS_OUTPUT_FILE")"
  mv "$FBS_OUTPUT_DIR/touca_generated.py" "$FBS_OUTPUT_FILE"
  rm -r "$FBS_OUTPUT_DIR"
  sed -i '/# namespace/d' "$FBS_OUTPUT_FILE"
  sed -i '/from touca.* import /d' "$FBS_OUTPUT_FILE"
  if ! command -v "black" >/dev/null 2>&1; then
    pip install black
  fi
  black -q "$FBS_OUTPUT_FILE"
elif [[ $(uname -s) == Darwin* ]]; then
  rm -rf "$FBS_OUTPUT_DIR"
  flatc --gen-onefile --gen-object-api --python -o "$FBS_OUTPUT_DIR" "$FBS_FILE"
  mkdir -p "$(dirname "$FBS_OUTPUT_FILE")"
  mv "$FBS_OUTPUT_DIR/touca_generated.py" "$FBS_OUTPUT_FILE"
  rm -rf "$FBS_OUTPUT_DIR"
  sed -i .bak '/# namespace/d' "$FBS_OUTPUT_FILE"
  sed -i .bak '/from touca.* import /d' "$FBS_OUTPUT_FILE"
  rm "$FBS_OUTPUT_FILE.bak"
fi
