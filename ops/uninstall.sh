#!/usr/bin/env bash
set -e

source /dev/stdin <<<"$( curl -fsSL https://raw.githubusercontent.com/trytouca/trytouca/main/ops/common.sh )"

DIR_INSTALL="$HOME/.touca/server"
if [ ! -d "$DIR_INSTALL/data" ]; then
    error "Expected Touca server to be installed at '$DIR_INSTALL'"
fi

# run_compose makes use of the following variables
FILE_COMPOSE="$DIR_INSTALL/ops/docker-compose.prod.yml"
DIR_PROJECT_ROOT="$DIR_INSTALL"

install_docker
install_docker_compose
run_compose stop
run_compose down
rm -rf "$DIR_INSTALL"/{data,logs,ops}
