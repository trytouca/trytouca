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

# this script expects bash v4.4 or higher

if [ "${BASH_VERSINFO[0]}" -lt 4 ] || { [ "${BASH_VERSINFO[0]}" -eq 4 ] && \
    [ "${BASH_VERSINFO[1]}" -lt 4 ]; }; then
    log_warning "you are using bash version ${BASH_VERSION}"
    log_error "this script requires bash version 4.4 or higher"
fi

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
