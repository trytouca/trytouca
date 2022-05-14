#!/usr/bin/env bash

# configure bash environment

set -o errexit -o pipefail -o noclobber -o nounset

ARG_VERBOSE=0

# initialize logging

__log () {
    if [ $# -lt 3 ]; then return 1; fi
    printf "\e[1;$2m%-10s\e[m %s\\n" "$1" "${@:3}"
}
log_debug () { [[ "${ARG_VERBOSE}" -ne 1 ]] || __log 'debug' '0' "$@"; }
log_info  () { __log 'info' '34' "$@"; }
log_warning () { __log 'warn' '33' "$@"; }
log_error () { __log 'error' '31' "$@"; return 1; }

# basic helper funcitons

require_env_var () {
    if [ $# -lt 1 ]; then return 1; fi
    for env in "$@"; do
        if [ -z "${!env}" ]; then
            log_error "environment variable $env is not set"
        fi
    done
}

has_function () {
  [ "$(type -t "$1")" == "function" ]
}

count_keys_if_set () {
    if [ $# -ne 1 ]; then return 1; fi
    local sum=0
    declare -A arr=${1#*=}
    for k in "${!arr[@]}"; do
        if [ "${arr[$k]}" -eq 1 ]; then
            sum=$((sum + 1))
        fi
    done
    echo $sum
}

docker_image_exists () {
    if [ $# -ne 1 ]; then return 1; fi
    local out
    out=$(docker image inspect "$1" >/dev/null 2>&1 && echo "0" || echo "1")
    [ "$out" == "0" ]
}

is_port_open () {
    if [ $# -ne 1 ]; then return 1; fi
    local out
    out=$(nc -z 127.0.0.1 "$1" >/dev/null 2>&1 && echo "0" || echo "1")
    [ "$out" == "0" ]
}

is_command_installed () {
    if [ $# -eq 0 ]; then return 1; fi
    for cmd in "$@"; do
        if ! hash "$cmd" 2>/dev/null; then
            log_warning "command $cmd is not installed"
            return 1
        fi
    done
    return 0
}

check_prerequisite_commands () {
    # shellcheck disable=SC2190
    arr=("$@")
    for i in "${arr[@]}"; do
        if ! is_command_installed "$i"; then
            log_error "cannot build component with missing prerequisites"
        fi
    done
    log_debug "all prerequisite packages are installed"
}

remove_dir_if_exists () {
    if [ $# -ne 1 ] && [ $# -ne 2 ]; then return 1; fi
    if [ -d "$1" ]; then
        if [ $# -eq 2 ]; then log_info "removing $2"; fi
        log_debug "removing directory $1"
        rm -rf "$1"
        log_info "removed directory $1"
    fi
}

remove_file_if_exists () {
    if [ $# -ne 1 ] && [ $# -ne 2 ]; then return 1; fi
    if [ -f "$1" ]; then
        if [ $# -eq 2 ]; then log_info "removing $2"; fi
        log_debug "removing $1"
        rm "$1"
        log_info "removed $1"
    fi
}

remove_docker_image_if_exists () {
    if [ $# -ne 1 ]; then return 1; fi
    if docker_image_exists "$1"; then
        log_info "removing docker image $1"
        docker rmi "$1"
        log_info "removed docker image $1"
    fi
}

run_compose () {
    if [ $# -eq 0 ]; then return 1; fi
    if [ ! -f "${FILE_COMPOSE}" ]; then
        log_warning "docker-compose file does not exist: ${FILE_COMPOSE}"
        return 1
    fi
    for arg in "$@"; do
        local cmd="docker-compose -f \"${FILE_COMPOSE}\" -p touca --project-directory \"${DIR_PROJECT_ROOT}\" $arg"
        if ! eval "$cmd"; then
            log_warning "failed to run $cmd"
            return 1
        fi
    done
    return 0
}

extract_secret () {
    if [ $# -ne 1 ]; then return 1; fi
    if [ ! -f "${FILE_COMPOSE}" ]; then
        log_warning "docker-compose file does not exist: ${FILE_COMPOSE}"
        return 1
    fi
    local value=$(grep $1 ${FILE_COMPOSE} | awk '{print $2}')
    echo $value
}

discord_notify () {
    if [ $# -ne 1 ]; then return 1; fi
    if [ ! -f "${FILE_COMPOSE}" ]; then
        log_warning "docker-compose file does not exist: ${FILE_COMPOSE}"
        return 1
    fi
    local discord_channel=$(extract_secret "DISCORD_CHANNEL")
    local discord_token=$(extract_secret "DISCORD_TOKEN")
    curl --silent \
        -H "Authorization: Bot ${discord_token}" \
        -H "User-Agent: touca_bot.sh (https://touca.io, v0.1)" \
        -H "Content-Type: application/json" \
        -d "{\"content\":\"${1}\"}" \
        "${discord_channel}"
}

redeploy () {
    log_info "stopping running containers"
    run_compose "stop" >/dev/null

    log_info "removing previous containers"
    run_compose "down" >/dev/null

    log_debug "pruning docker resources"
    if ! docker system prune --force >/dev/null; then
        log_error "failed to prune docker resources"
    fi
    log_info "pruned docker resources"

    log_debug "pulling new docker images"
    if ! run_compose "pull" >/dev/null; then
        log_error "failed to pull new docker images"
    fi
    log_info "pulled new docker images"

    log_debug "starting new docker containers"
    if ! run_compose "up -d" >/dev/null; then
        log_error "failed to start new containers"
    fi
    log_info "started new docker containers"

    log_info "deployment is complete"
}

question () { printf "\e[1;36m#\e[m $@\\n"; }
answer () { printf "\e[1;33m\$\e[m "; }
info () { printf "\e[1;32m-\e[m $@\\n"; }
error () { printf "\e[1;31m-\e[m $@\\n"; return 1; }

ask_name() {
    local default="stranger"
    info "Hi, Thank you for trying Touca!"
    question "What is your first name?"
    answer
    read -r OUTPUT
    OUTPUT=${OUTPUT:=$default}
    info "Nice to meet you, $OUTPUT!"
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
    response=${response,,}
    [ "${response:0:1}" == 'y' ]
}

confirm_data_removal() {
    if [ ! -d "$DIR_INSTALL/data" ]; then return 0; fi
    info "We found a previous install of Touca."
    question "Should we remove it? [y/n] (default is yes)"
    if answer_is_yes; then return 0; fi
    info "This script only supports a fresh install."
    info "Use upgrade.sh if you like to keep your current data."
    info "bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/trytouca/trytouca/main/ops/upgrade.sh)\""
    error "Have a good day, $HUMAN_NAME!"
}

install_docker() {
    if is_command_installed "docker"; then return 0; fi
    info "We use Docker to install Touca server. We could not find it on your system."
    question "Would you like us to install it?"
    if ! answer_is_yes; then
        info "Welp, we cannot go ahead without Docker."
        error "Have a good day, $HUMAN_NAME!"
    fi
    info "Setting up Docker"
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo -E apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
    sudo apt update
    sudo apt-cache policy docker-ce
    sudo apt install -y docker-ce
    sudo usermod -aG docker "${USER}"
}

install_docker_compose() {
    if is_command_installed "docker-compose"; then return 0; fi
    info "We use docker-compose to install Touca server. We could not find it on your system."
    question "Would you like us to install it?"
    if ! answer_is_yes; then
        info "Welp, we cannot go ahead without docker-compose."
        error "Have a good day, $HUMAN_NAME!"
    fi
    sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose || true
    sudo chmod +x /usr/local/bin/docker-compose
}

server_status_check() {
    info "Checking if containers are up"
    local connected=false
    for num in {1..10}; do
        sleep 5
        if [[ $(curl -s -X GET "http://localhost/api/platform") == *"\"ready\":true"* ]]; then
            connected=true
            break
        fi
        info "Checking... (attempt $num/10)"
    done
    if [ $connected = false ]; then
        info "Touca server did not pass our health checks in time."
        info "Feel free to rerun this script to make sure everything is fine."
        error "Have a good day, $HUMAN_NAME!"
    fi
    info "Touca server is up and running."
    info "Browse to http://localhost/ to complete the installation."
}
