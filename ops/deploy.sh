#!/usr/bin/env bash

# declare project structure

ARG_VERBOSE=0
ARG_REGION="us-east-2"
DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_PROJECT_ROOT="$(dirname "$DIR_SCRIPT")"

# shellcheck source=./common.sh
# shellcheck disable=SC1091
source "${DIR_PROJECT_ROOT}/ops/common.sh"

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

FILE_COMPOSE="${DIR_PROJECT_ROOT}/ops/docker-compose.prod.yml"
PKG_REGISTRY="${ARG_REGISTRY}"
PKG_USERNAME="${ARG_USERNAME}"
PKG_REGION="${ARG_REGION}"

log_debug "authenticating to docker package registry"
if ! aws ecr get-login-password --region "${PKG_REGION}" | docker login "${PKG_REGISTRY}" -u "${PKG_USERNAME}" --password-stdin  >/dev/null; then
    log_error "failed to authenticate to docker package registry"
fi
log_info "authenticated to docker package registry"

redeploy

log_debug "sending notification on discord"
discord_notify "Deployed to touca.io"
log_info "sent notification on discord"
