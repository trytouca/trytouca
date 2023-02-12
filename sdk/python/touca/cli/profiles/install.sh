#!/usr/bin/env bash
# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$HOME/.touca/install"
mkdir -p "$DEPLOY_DIR"
mv "$DIR_SCRIPT/sample_app" "$DEPLOY_DIR"
