#!/usr/bin/env bash
set -e

source /dev/stdin <<<"$( curl -fsSL https://raw.githubusercontent.com/trytouca/trytouca/main/ops/common.sh )"

ask_install_dir
DIR_INSTALL=$OUTPUT
EXTENSION=$(has_cli_option "--dev" "$@" && echo "dev" || echo "prod")
export FILE_COMPOSE="$DIR_INSTALL/ops/docker-compose.$EXTENSION.yml"
export DIR_PROJECT_ROOT="$DIR_INSTALL"

install_docker
install_docker_compose

install_file() {
    mkdir -p "$(dirname "$DIR_INSTALL/$1")"
    if has_cli_option "--dev" "$@"; then
        local dir_script
        dir_script="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        cp "$(dirname "$dir_script")/$1" "$DIR_INSTALL/$1"
    else
        local remote="https://raw.githubusercontent.com/trytouca/trytouca/main"
        curl -sS "$remote/$1" -o "$DIR_INSTALL/$1"
    fi
}

if has_cli_option "--uninstall" "$@"; then
    if [ ! -d "$DIR_INSTALL" ]; then
        error "Expected Touca server to be installed at '$DIR_INSTALL'"
    fi
    run_compose stop
    run_compose down
    rm -rf "$DIR_INSTALL"/{data,logs,ops}
else
    confirm_data_removal
    rm -rf "$DIR_INSTALL"/{data,logs,ops}
    mkdir -p "$DIR_INSTALL"/data/{minio,mongo,redis}
    install_file "ops/docker-compose.$EXTENSION.yml"
    install_file "ops/mongo/entrypoint/entrypoint.js"
    install_file "ops/mongo/mongod.conf"
    redeploy
    if ! has_cli_option "--dev" "$@"; then server_status_check; fi
    info "Have a good day, stranger!"
fi
