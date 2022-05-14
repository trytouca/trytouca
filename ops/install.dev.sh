#!/usr/bin/env bash
set -e

source <(curl -s https://raw.githubusercontent.com/trytouca/trytouca/main/ops/common.sh)

ask_name
HUMAN_NAME=$OUTPUT
ask_install_dir
DIR_INSTALL=$OUTPUT

# run_compose makes use of the following variables
FILE_COMPOSE="$DIR_INSTALL/repo/ops/docker-compose.dev.yml"
DIR_PROJECT_ROOT="$DIR_INSTALL"

confirm_data_removal

rm -rf "$DIR_INSTALL/repo"
mkdir -p "$DIR_INSTALL"
git clone --single-branch --branch main https://github.com/trytouca/trytouca.git "$DIR_INSTALL/repo" &> /dev/null || true
source "$DIR_INSTALL/repo/ops/common.sh"

check_prerequisite_commands "docker" "docker-compose"

info "Stopping running containers"
run_compose stop >/dev/null 2>&1
info "Removing previous containers"
run_compose down >/dev/null 2>&1
info "Pruning docker resources"
if ! docker system prune --force >/dev/null 2>&1; then
    log_error "failed to prune docker resources"
fi

rm -rf "$DIR_INSTALL"/{data,logs}
mkdir -p "$DIR_INSTALL"/logs/{backend,cmp} "$DIR_INSTALL"/data/{minio,mongo,redis}
info "Pulling new docker images"
run_compose pull >/dev/null 2>&1
info "Starting new docker containers"
run_compose "up -d" >/dev/null 2>&1

info "Have a good day, $HUMAN_NAME!"
