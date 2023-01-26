#!/usr/bin/env bash
# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

function copy() {
    local root
    root="$(cd "$(dirname "$(dirname "$(dirname "${BASH_SOURCE[0]}")")")" && pwd)"
    path_src="$root/$1"
    for dir_dst in "${@:2}"; do
        echo "copying $1 to $dir_dst/"
        cp "$path_src" "$root/$dir_dst/"
    done
}

copy "web/public/favicon.ico"                   "app/src" \
                                                "docs/static/img" \
                                                "sdk/python/docs/_static" \
                                                "sdk/cpp/docs/sphinx/_static"
copy "web/public/icons/apple-touch-icon.png"    "app/src/assets/icons"
copy "web/public/icons/favicon-16x16.png"       "app/src/assets/icons"
copy "web/public/icons/favicon-32x32.png"       "app/src/assets/icons"
copy "web/public/icons/icon-192x192.png"        "app/src/assets/icons"
copy "web/public/icons/icon-512x512.png"        "app/src/assets/icons"
copy "web/public/images/touca_logo_bg.png"      "docs/static/img"
copy "web/public/images/touca_logo_bg.svg"      "app/src/assets/logo"
copy "web/public/images/touca_logo_fgt.svg"     "app/src/assets/logo"
copy "web/public/images/touca_logo_fg.svg"      "app/src/assets/logo"
copy "web/public/images/touca_logo_fgwt.svg"    "sdk/python/docs/_static" \
                                                "sdk/cpp/docs/sphinx/_static"
