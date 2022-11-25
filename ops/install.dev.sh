#!/usr/bin/env bash
set -e

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR_SCRIPT/common.sh"

ask_install_dir
DIR_INSTALL=$OUTPUT
export FILE_COMPOSE="$DIR_INSTALL/ops/docker-compose.dev.yml"
export DIR_PROJECT_ROOT="$DIR_INSTALL"

fetch_file() {
    mkdir -p "$(dirname "$DIR_INSTALL/$1")"
    cp "$(dirname "$DIR_SCRIPT")/$1" "$DIR_INSTALL/$1"
}

install_docker
install_docker_compose

confirm_data_removal
rm -rf "$DIR_INSTALL"/{data,logs,ops}

mkdir -p "$DIR_INSTALL"/data/{minio,mongo,redis}
fetch_file "ops/docker-compose.dev.yml"
fetch_file "ops/mongo/entrypoint/entrypoint.js"
fetch_file "ops/mongo/mongod.conf"

redeploy
info "Have a good day, stranger!"
