#!/usr/bin/env bash
set -e

source /dev/stdin <<<"$( curl -fsSL https://raw.githubusercontent.com/trytouca/trytouca/main/ops/common.sh )"

ask_install_dir
DIR_INSTALL=$OUTPUT
export FILE_COMPOSE="$DIR_INSTALL/ops/docker-compose.prod.yml"
export DIR_PROJECT_ROOT="$DIR_INSTALL"

if [ ! -d "$DIR_INSTALL" ]; then
    error "Expected Touca server to be installed at '$DIR_INSTALL'"
fi

install_docker
install_docker_compose

run_compose stop
run_compose down
rm -rf "$DIR_INSTALL"/{data,logs,ops}
