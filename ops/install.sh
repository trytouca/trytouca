#!/usr/bin/env bash

set -o errexit -o pipefail -o noclobber -o nounset

# initialize logging

__log () {
    if [ $# -lt 3 ]; then return 1; fi
    printf "\e[1;$2m%-10s\e[m %s\\n" "$1" "${@:3}"
}
log_info  () { __log 'info' '34' "$@"; }
log_warning () { __log 'warn' '33' "$@"; }
log_error () { __log 'error' '31' "$@"; return 1; }

question () { printf "\e[1;36m#\e[m $@\\n"; }
answer () { printf "\e[1;33m>\e[m "; }
info () { printf "\e[1;32m-\e[m $@\\n"; }
error () { printf "\e[1;31m-\e[m $@\\n"; return 1; }

# basic helper funcitons

is_command_installed () {
    if [ $# -eq 0 ]; then return 1; fi
    for cmd in "$@"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_warning "command $cmd is not installed"
            return 1
        fi
    done
    return 0
}

run_compose () {
    if [ $# -eq 0 ]; then return 1; fi
    local file_compose="$DIR_INSTALL/ops/docker-compose.$EXTENSION.yml"
    if [ ! -f "${file_compose}" ]; then
        log_warning "docker-compose file does not exist: ${file_compose}"
        return 1
    fi
    for arg in "$@"; do
        local cmd
        cmd="UID_GID="$(id -u):$(id -g)" docker-compose -f \"${file_compose}\" -p touca --project-directory \"${DIR_INSTALL}\" $arg"
        if ! eval "$cmd"; then
            log_warning "failed to run $cmd"
            return 1
        fi
    done
    return 0
}

ask_install_dir() {
    local default="$HOME/.touca/server"
    question "Where should we install Touca? (default is \e[1;36m$default\e[m)"
    answer
    read -r OUTPUT
    OUTPUT=${OUTPUT:=$default}
    info "Installing into ${OUTPUT}"
}

answer_is_yes () {
    answer
    local response
    read -r response
    response=${response:=y}
    [ "${response:0:1}" == 'y' ]
}

confirm_data_removal() {
    if [ ! -d "$DIR_INSTALL/data" ]; then return 0; fi
    info "We found a previous install of Touca."
    question "Should we remove it? [y/n] (default is yes)"
    if answer_is_yes; then return 0; fi
    info "This script only supports a fresh install."
    error "Have a good day!"
}

install_docker() {
    if is_command_installed "docker"; then return 0; fi
    info "We use Docker to install Touca server. We could not find it on your system."
    info "Please install docker and try this script again."
    info "See https://docs.docker.com/get-docker/ for instructions."
    error "Have a good day!"
}

install_docker_compose() {
    if is_command_installed "docker-compose"; then return 0; fi
    info "We use docker-compose to install Touca server. We could not find it on your system."
    info "Please install docker-compose and try this script again."
    info "See https://docs.docker.com/compose/install/ for instructions."
    error "Have a good day!"
}

server_status_check() {
    info "Checking if containers are up"
    local connected=false
    for num in {1..10}; do
        sleep 5
        if [[ $(curl -s -X GET "http://localhost:8080/api/platform") == *"\"ready\":true"* ]]; then
            connected=true
            break
        fi
        info "Checking... (attempt $num/10)"
    done
    if [ $connected = false ]; then
        info "Touca server did not pass our health checks in time."
        info "Feel free to rerun this script to make sure everything is fine."
        error "Have a good day!"
    fi
    info "Touca server is up and running."
    info "Browse to http://localhost:8080/ to complete the installation."
}

has_cli_option() {
    local has_arg=0
    local option="$1"
    for arg in "${@:2}"; do
        case $arg in
            "$option")
                has_arg=1
            ;;
        esac
    done
    [ $has_arg == 1 ]
}

install_file() {
    mkdir -p "$(dirname "$DIR_INSTALL/$1")"
    if has_cli_option "--dev" "$ARGS"; then
        local dir_script
        dir_script="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        cp "$(dirname "$dir_script")/$1" "$DIR_INSTALL/$1"
    else
        local remote="https://raw.githubusercontent.com/trytouca/trytouca/main"
        curl -sS "$remote/$1" -o "$DIR_INSTALL/$1"
    fi
}

ask_install_dir
ARGS="$*"
DIR_INSTALL=$OUTPUT
EXTENSION=$(has_cli_option "--dev" "$@" && echo "dev" || echo "prod")

install_docker
install_docker_compose

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
    info "Stopping running containers"
    run_compose stop
    info "Removing previous containers"
    run_compose down
    info "Pruning docker resources"
    if ! docker system prune --force; then
        error "Failed to prune docker resources"
    fi
    info "Pulling new docker images"
    run_compose pull
    info "Starting new docker containers"
    run_compose "up -d"
    if ! has_cli_option "--dev" "$@"; then server_status_check; fi
    info "Have a good day, stranger!"
fi
