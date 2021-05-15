#!/usr/bin/env bash

# configure bash environment

set -o errexit -o pipefail -o noclobber -o nounset

# declare project structure

ARG_VERBOSE=0
ARG_REGION="us-east-2"
DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_PROJECT_ROOT="$(dirname "$DIR_SCRIPT")"

# show usage

show_usage () {
    cat << EOF

Usage:

  -h, --help              shows this message
  -v, --version           shows version

  -r, --registry  ARG         docker registry url
  -u, --username  ARG         docker registry username

Example:

  ${BASH_SOURCE[0]} -r "aws_account_number.${ARG_REGION}.amazonaws.com" -u "AWS"

EOF
}

# initialize logging

__log () {
    if [ $# -lt 3 ]; then return 1; fi
    printf "\e[1;$2m%-10s\e[m %s\\n" "$1" "${@:3}"
}
log_debug () { [[ "${ARG_VERBOSE}" -ne 1 ]] || __log 'debug' '0' "$@"; }
log_info  () { __log 'info' '34' "$@"; }
log_warning () { __log 'warn' '33' "$@"; }
log_error () { __log 'error' '31' "$@"; return 1; }

# check that docker-compose is installed

for i in "docker" "docker-compose"; do
    if ! hash "$i" 2>/dev/null; then
        log_error "command $i is not installed"
        return 1
    fi
done

# parse command line arguments

ARG_HELP=0
ARG_VERSION=0
ARG_REGISTRY=""
ARG_USERNAME=""

for arg in "$@"; do
    case $arg in
        "-h" | "help" | "--help")
            ARG_HELP=1
            ;;
        "-v" | "version" | "--version")
            ARG_VERSION=1
            ;;
        "-r" | "--registry")
            ARG_REGISTRY="$2"
            shift
            shift
            ;;
        "-u" | "--username")
            ARG_USERNAME="$2"
            shift
            shift
            ;;
    esac
done

log_debug "Specified command line arguments:"
log_debug " - ARG_REGISTRY: ${ARG_REGISTRY}"
log_debug " - ARG_USERNAME: ${ARG_USERNAME}"

if [[ ${ARG_VERSION} -eq 1 ]]; then
    git describe --tags
    exit
fi

if [[ ${ARG_HELP} -eq 1 ]]; then
    show_usage
    exit
fi

if [[ -z "${ARG_REGISTRY// }" ]]; then
    log_warning "url to docker registry must be specified"
    show_usage
    exit
fi

if [[ -z "${ARG_USERNAME// }" ]]; then
    log_warning "username to docker registry must be specified"
    show_usage
    exit
fi

# define deployment variables

FILE_COMPOSE="${DIR_PROJECT_ROOT}/devops/docker-compose.prod.yml"
PKG_REGISTRY="${ARG_REGISTRY}"
PKG_USERNAME="${ARG_USERNAME}"
PKG_REGION="${ARG_REGION}"

if [ ! -f "${FILE_COMPOSE}" ]; then
    log_error "docker-compose file does not exist: ${FILE_COMPOSE}"
fi

# define utility functions

run_compose () {
    if [ $# -eq 0 ]; then return 1; fi
    for arg in "$@"; do
        local cmd="docker-compose -f \"${FILE_COMPOSE}\" -p touca --project-directory \"${DIR_PROJECT_ROOT}\" $arg"
        if ! eval "$cmd"; then
            log_warning "failed to run $cmd"
            return 1
        fi
    done
    return 0
}

# run deployment process

log_info "stopping running containers"
run_compose "stop" >/dev/null

log_info "removing previous containers"
run_compose "down" >/dev/null

log_debug "pruning docker resources"
if ! docker system prune --force >/dev/null; then
    log_error "failed to prune docker resources"
fi
log_info "pruned docker resources"

log_debug "authenticating to docker package registry"

if ! aws ecr get-login-password --region "${PKG_REGION}" | docker login "${PKG_REGISTRY}" -u "${PKG_USERNAME}" --password-stdin  >/dev/null; then
    log_error "failed to authenticate to docker package registry"
fi
log_info "authenticated to docker package registry"

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
