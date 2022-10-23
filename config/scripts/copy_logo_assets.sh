#!/bin/bash

function copy() {
    local root
    root="$(cd "$(dirname "$(dirname "$(dirname "${BASH_SOURCE[0]}")")")" && pwd)"
    path_src="$root/$1"
    for dir_dst in "${@:2}"; do
        echo "copying $1 to $dir_dst/"
        cp "$path_src" "$root/$dir_dst/"
    done
}

copy "web/public/favicon.ico"                           "app/src" \
                                                        "docs/static/img" \
                                                        "sdk/python/docs/_static" \
                                                        "sdk/cpp/docs/sphinx/_static"
copy "web/public/logo/touca-logo-v1.5-bg.png"           "docs/static/img"
copy "web/public/icons/apple-touch-icon.png"            "app/src/assets/icons"
copy "web/public/icons/favicon-16x16.png"               "app/src/assets/icons"
copy "web/public/icons/favicon-32x32.png"               "app/src/assets/icons"
copy "web/public/icons/icon-192x192.png"                "app/src/assets/icons"
copy "web/public/icons/icon-512x512.png"                "app/src/assets/icons"
copy "web/public/logo/touca-logo-v1.5-bg.svg"               "app/src/assets/logo"
copy "web/public/logo/touca-logo-v1.5-transparent-text.svg" "app/src/assets/logo"
copy "web/public/logo/touca-logo-v1.5-transparent.svg"      "app/src/assets/logo"
copy "web/public/logo/touca-logo-v1.5-white-w-text.svg"     "sdk/python/docs/_static" \
                                                            "sdk/cpp/docs/sphinx/_static"
