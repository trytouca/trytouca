#!/usr/bin/env bash

show_usage () {
    cat << EOF
usage: $(basename "$0") [ -h | --long-options]
  -h, --help                shows this message
  --debug                   enable debug logs

Components:
  --minio                   remove all data from minio container
  --mongo                   remove all data from mongo container
  --redis                   remove all data from redis container
  --all                     remove all testresults
EOF
}

# configure bash environment

set -o errexit -o pipefail -o noclobber -o nounset

# declare project structure

ARG_VERBOSE=0
DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_PROJECT_ROOT="$(dirname "${DIR_SCRIPT}")"

# include common helper functions

# shellcheck source=./common.sh
# shellcheck disable=SC1091
source "${DIR_PROJECT_ROOT}/devops/common.sh"

# main helper functions

build_components () {
    if [ $# -lt 2 ]; then return 1; fi
    declare -A components=${1#*=}
    declare -A modes=${2#*=}

    for K in "${!components[@]}"; do
        if [ "${components[$K]}" -eq 0 ]; then continue; fi
        for mode in "${!modes[@]}"; do
            if [ "${modes[$mode]}" -eq 0 ]; then
                continue;
            fi
            local func_name="func_${K//'-'/'_'}_${mode//'-'/'_'}"
            if has_function "${func_name}"; then
                log_debug "calling $mode recipe for component $K"
                ($func_name "")
            else
                log_warning "build mode $mode not supported for component $K ($func_name)"
            fi
        done
    done
}

# build recipes

func_minio_clear () {
    local port="9000"
    if ! is_port_open "${port}"; then
        log_error "minio is not running on port ${port}"
    fi
    check_prerequisite_commands "mc"
    for bucket in "comparisons" "messages" "results"; do
        mc rm --recursive --force --dangerous "local/touca-${bucket}" || true
    done
    log_info "removed all items in object storage database"
}

func_mongo_clear () {
    local port="27017"
    if ! is_port_open "${port}"; then
        log_error "mongodb is not running on port ${port}"
    fi
    check_prerequisite_commands "mongo"
mongo <<EOF
use touca
db.comments.remove({})
db.comparisons.remove({})
db.suites.remove({})
db.batches.remove({})
db.elements.remove({})
db.messages.remove({})
db.mails.remove({})
db.reports.remove({})
db.notifications.remove({})
db.sessions.remove({})
db.teams.remove({})
db.users.deleteMany({ "platformRole": { "\$ne": "super" } })
EOF
}

func_redis_clear () {
    local port="6379"
    if ! is_port_open "${port}"; then
        log_error "redis is not running on port ${port}"
    fi
    check_prerequisite_commands "redis-cli"
    redis-cli FLUSHDB
}

# check command line arguments

declare -A COMPONENTS=(
    ["minio"]=0
    ["mongo"]=0
    ["redis"]=0
)
declare -A BUILD_MODES=(
    ["help"]=0
    ["clear"]=1
)

for arg in "$@"; do
    case $arg in
        "-h" | "help" | "--help")
            BUILD_MODES["help"]=1
            BUILD_MODES["clear"]=0
            ;;
        "--debug")
            # shellcheck disable=SC2034
            ARG_VERBOSE=1
            ;;
        "--minio")
            COMPONENTS["minio"]=1
            ;;
        "--mongo")
            COMPONENTS["mongo"]=1
            ;;
        "--redis")
            COMPONENTS["redis"]=1
            ;;
        "--all")
            COMPONENTS["minio"]=1
            COMPONENTS["mongo"]=1
            COMPONENTS["redis"]=1
            ;;
        *)
            log_warning "invalid argument $arg"
            show_usage
            exit
            ;;
    esac
done

count_components="$(count_keys_if_set "$(declare -p COMPONENTS)")"
if [ "$count_components" -eq 0 ] && [ "${BUILD_MODES["help"]}" -eq 1 ]; then
    show_usage
    exit
fi

build_components \
    "$(declare -p COMPONENTS)" \
    "$(declare -p BUILD_MODES)"
