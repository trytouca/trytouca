#!/usr/bin/env bash

# configure bash environment
set -o pipefail -o noclobber -o nounset

# initialize logging

__log () {
    if [ $# -lt 3 ]; then return 1; fi
    printf "\e[1;$2m%-10s\e[m %s\\n" "$1" "${@:3}"
}
log_debug () { [[ "${ARG_VERBOSE}" -ne 1 ]] || __log 'debug' '0' "$@"; }
log_info  () { __log 'info' '34' "$@"; }
log_warning () { __log 'warn' '33' "$@"; }
log_error () { __log 'error' '31' "$@"; return 1; }

# # this script expects bash v4.4 or higher

if [ "${BASH_VERSINFO[0]}" -lt 4 ] || { [ "${BASH_VERSINFO[0]}" -eq 4 ] && \
    [ "${BASH_VERSINFO[1]}" -lt 4 ]; }; then
    log_warning "you are using bash version ${BASH_VERSION}"
    log_error "this script requires bash version 4.4 or higher"
fi

# content of the desired license

read -r -d '' LICENSE_CONTENT1 << EOM
// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

EOM

read -r -d '' LICENSE_CONTENT2 << EOM
# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.
EOM

read -r -d '' LICENSE_CONTENT3 << EOM
% Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.
EOM

declare -A PREFIX_MAP=(
    ["*.cpp"]="${LICENSE_CONTENT1}"
    ["*.hpp"]="${LICENSE_CONTENT1}"
    ["*.fbs"]="${LICENSE_CONTENT1}"
    ["*.cmake"]="${LICENSE_CONTENT2}"
    ["CMakeLists.txt"]="${LICENSE_CONTENT2}"
    ["*.tex"]="${LICENSE_CONTENT3}"
    ["*.sty"]="${LICENSE_CONTENT3}"
    ["*.ts"]="${LICENSE_CONTENT1}"
    ["*.scss"]="${LICENSE_CONTENT1}"
    ["*.py"]="${LICENSE_CONTENT2}"
)

find_files_with_extension() {
    if [ $# -ne 1 ]; then log_error "expected argument"; fi
    declare -A exclusion_items=(
        ["local"]="d"
        ["dist"]="d"
        ["node_modules"]="d"
        [".env"]="d"
    )
    # local exclusion_list=("local" "node_modules")
    local exclude_cmd=""
    for item in "${!exclusion_items[@]}"; do
        local item_type="${exclusion_items[$item]}"
        exclude_cmd="${exclude_cmd} -type ${item_type} -name ${item} -prune -o "
    done
    # shellcheck disable=SC2086
    find . ${exclude_cmd} -name $1 -type f -print0
}

for EXT in "${!PREFIX_MAP[@]}"; do
    CONTENT=${PREFIX_MAP[$EXT]}
    readarray -d '' FILES < <(find_files_with_extension "${EXT}")
    for FILE in "${FILES[@]}"; do
        # ensure file ends with newline
        tail -c1 "$FILE" | read -r _ || echo >> "$FILE"
        # remove trailing whitespaces
        sed -i '' -e's/[[:space:]]*$//' "$FILE"
        # check license block
        HEAD_LINES=$(echo "$CONTENT" | wc -l)
        HEAD=$(head -n "$HEAD_LINES" "$FILE")
        if [ "$CONTENT" != "$HEAD" ]; then
            log_warning "license missing: ${FILE}"
            # printf "%s\n\n%s\n" "${CONTENT}" "$(cat "${FILE}")" > tmp.txt && mv tmp.txt "${FILE}"
        fi
    done
done
