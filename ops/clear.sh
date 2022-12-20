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

# this script expects bash v4.4 or higher

if [ "${BASH_VERSINFO[0]}" -lt 4 ] || { [ "${BASH_VERSINFO[0]}" -eq 4 ] && \
    [ "${BASH_VERSINFO[1]}" -lt 4 ]; }; then
    log_warning "you are using bash version ${BASH_VERSION}"
    log_error "this script requires bash version 4.4 or higher"
fi

# main helper functions

is_port_open () {
    if [ $# -ne 1 ]; then return 1; fi
    local out
    out=$(nc -z 127.0.0.1 "$1" >/dev/null 2>&1 && echo "0" || echo "1")
    [ "$out" == "0" ]
}

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

check_prerequisite_commands () {
    # shellcheck disable=SC2190
    arr=("$@")
    for i in "${arr[@]}"; do
        if ! is_command_installed "$i"; then
            log_error "cannot build component with missing prerequisites"
        fi
    done
}

clear_minio () {
    local port="9000"
    local username="toucauser"
    local password="toucapass"
    local server_path="$HOME/.touca/server"
    if ! is_port_open "${port}"; then
        log_error "minio is not running on port ${port}"
    fi
    check_prerequisite_commands "mc"
    mc alias set local "http://localhost:${port}" "${username}" "${password}"
    pushd "${server_path}/data/minio"
    mc rm --recursive --force --dangerous "touca"
    popd
    log_info "removed all items in object storage database"
}

clear_mongo () {
    local port="27017"
    local username="toucauser"
    local password="toucapass"
    if ! is_port_open "${port}"; then
        log_error "mongodb is not running on port ${port}"
    fi
    check_prerequisite_commands "mongosh"
    mongosh --quiet -u "${username}" -p "${password}" --port "${port}" <<EOF
use touca
db.getCollectionNames().forEach(function(c) {
  if (!c.match("^system.indexes" && !c.match("^users"))) {
      db.getCollection(c).deleteMany({});
  }
});
db.users.deleteMany({ "platformRole": { "\$ne": "super" } })
EOF
}

clear_redis () {
    local port="6379"
    if ! is_port_open "${port}"; then
        log_error "redis is not running on port ${port}"
    fi
    check_prerequisite_commands "redis-cli"
    redis-cli -p "${port}" FLUSHDB
}

clear_minio
clear_mongo
clear_redis
