#!/usr/bin/env bash
set -e

source /dev/stdin <<<"$( curl -fsSL https://raw.githubusercontent.com/trytouca/trytouca/main/ops/common.sh )"

ask_install_dir
DIR_INSTALL=$OUTPUT
export FILE_COMPOSE="$DIR_INSTALL/ops/docker-compose.prod.yml"
export DIR_PROJECT_ROOT="$DIR_INSTALL"

fetch_file() {
    local remote="https://raw.githubusercontent.com/trytouca/trytouca/main"
    mkdir -p "$(dirname "$DIR_INSTALL/$1")"
    curl -sS "$remote/$1" -o "$DIR_INSTALL/$1"
}

install_docker
install_docker_compose

confirm_data_removal
rm -rf "$DIR_INSTALL"/{data,logs,ops}

mkdir -p "$DIR_INSTALL"/data/{minio,mongo,redis}
fetch_file "ops/docker-compose.prod.yml"
fetch_file "ops/mongo/entrypoint/entrypoint.js"
fetch_file "ops/mongo/mongod.conf"

redeploy
server_status_check
info "Have a good day, stranger!"
