#!/usr/bin/env bash
set -e

question () { printf "\e[1;36m#\e[m $@\\n"; }
answer () { printf "\e[1;33m\$\e[m "; }
info () { printf "\e[1;32m-\e[m $@\\n"; }

DIR_INSTALL_DEFAULT="$HOME/.touca/server"

info "Hi, Thank you for trying Touca!"
question "What is your first name?"
answer
read -r HUMAN_NAME
info "Nice to meet you, ${HUMAN_NAME:=stranger}!"

question "Where should we install Touca? Leave empty to use \e[1;36m$DIR_INSTALL_DEFAULT\e[m."
answer
read -r DIR_INSTALL
DIR_INSTALL=${DIR_INSTALL:=$DIR_INSTALL_DEFAULT}
FILE_COMPOSE="$DIR_INSTALL/repo/ops/docker-compose.prod.yml"
DIR_PROJECT_ROOT="$DIR_INSTALL"

info "Installing into ${DIR_INSTALL}..."
rm -rf "$DIR_INSTALL/repo"
mkdir -p "$DIR_INSTALL"
git clone https://github.com/trytouca/trytouca.git "$DIR_INSTALL/repo" &> /dev/null || true
source "$DIR_INSTALL/repo/ops/common.sh"
check_prerequisite_commands "docker" "docker-compose"

info "Stopping running containers"
run_compose stop >/dev/null
info "Removing previous containers"
run_compose down >/dev/null
info "Pruning docker resources"
if ! docker system prune --force >/dev/null; then
    log_error "failed to prune docker resources"
fi
info "Pulling new docker images"
run_compose pull >/dev/null
info "Starting new docker containers"
mkdir -p \
    "$DIR_INSTALL/logs/backend" \
    "$DIR_INSTALL/logs/cmp" \
    "$DIR_INSTALL/data/minio" \
    "$DIR_INSTALL/data/mongo" \
    "$DIR_INSTALL/data/redis"
run_compose "up -d" >/dev/null
info "Deployment is complete"
