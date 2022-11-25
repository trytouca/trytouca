#!/usr/bin/env bash
set -e

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR_SCRIPT/common.sh"

ask_install_dir
DIR_INSTALL=$OUTPUT
export FILE_COMPOSE="$DIR_INSTALL/ops/docker-compose.dev.yml"
export DIR_PROJECT_ROOT="$DIR_INSTALL"

if [ ! -d "$DIR_INSTALL" ]; then
    error "Expected Touca server to be installed at '$DIR_INSTALL'"
fi

install_docker
install_docker_compose

run_compose stop
run_compose down
rm -rf "$DIR_INSTALL"/{data,logs,ops}
