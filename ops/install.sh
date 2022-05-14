#!/usr/bin/env bash
set -e

source /dev/stdin <<<"$( curl -fsSL https://raw.githubusercontent.com/trytouca/trytouca/main/ops/common.sh )"

ask_name
HUMAN_NAME=$OUTPUT
ask_install_dir
DIR_INSTALL=$OUTPUT

# run_compose makes use of the following variables
FILE_COMPOSE="$DIR_INSTALL/repo/ops/docker-compose.prod.yml"
DIR_PROJECT_ROOT="$DIR_INSTALL"

confirm_data_removal

rm -rf "$DIR_INSTALL/repo"
mkdir -p "$DIR_INSTALL"
git clone --single-branch --branch main https://github.com/trytouca/trytouca.git "$DIR_INSTALL/repo" &> /dev/null || true
source "$DIR_INSTALL/repo/ops/common.sh"

install_docker
install_docker_compose

rm -rf "$DIR_INSTALL"/{data,logs}
mkdir -p "$DIR_INSTALL"/logs/{backend,cmp} "$DIR_INSTALL"/data/{minio,mongo,redis}

redeploy
server_status_check
info "Have a good day, $HUMAN_NAME!"
