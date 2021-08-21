#!/usr/bin/env bash

# configure bash environment

set -o errexit -o pipefail -o noclobber -o nounset

# declare project structure

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

# # this script expects bash v4.4 or higher

if [ "${BASH_VERSINFO[0]}" -lt 4 ] || { [ "${BASH_VERSINFO[0]}" -eq 4 ] && \
    [ "${BASH_VERSINFO[1]}" -lt 4 ]; }; then
    log_warning "you are using bash version ${BASH_VERSION}"
    log_error "this script requires bash version 4.4 or higher"
fi

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_PROJECT_ROOT="$(dirname $(dirname "${DIR_SCRIPT}"))"
DIR_CLIENTS="${DIR_PROJECT_ROOT}/clients"
DIR_EXAMPLES="${DIR_PROJECT_ROOT}/clients/examples"

rm -rf "${DIR_EXAMPLES}/cpp"
cp -r "${DIR_CLIENTS}/cpp/examples" "${DIR_EXAMPLES}/cpp"
sed -i '' 's/\("datasets-dir":\).*/\1 ".\/examples\/cpp\/04_cpp_external_input\/datasets"/g' "${DIR_EXAMPLES}/cpp/04_cpp_external_input/config.json"
for filename in ".clang-format" ".dockerignore" "build.sh" "CMakeLists.txt" "Dockerfile" "cmake/external.cmake"; do
    git -C "${DIR_EXAMPLES}" checkout "${DIR_EXAMPLES}/cpp/${filename}"
done

rm -rf "${DIR_EXAMPLES}/python"
cp -r "${DIR_CLIENTS}/python/examples" "${DIR_EXAMPLES}/python"
for filename in "01_python_minimal/requirements.txt" "02_python_basic_api/requirements.txt" "03_python_client_api/requirements.txt" "04_python_external_files"; do
    git -C "${DIR_EXAMPLES}" checkout "${DIR_EXAMPLES}/python/${filename}"
done

rm -rf "${DIR_EXAMPLES}/javascript"
cp -r "${DIR_CLIENTS}/js/examples" "${DIR_EXAMPLES}/javascript"
sed -i '' 's/\("extends":\).*/\1 "..\/tsconfig.json",/g' "${DIR_EXAMPLES}/javascript/01_node_minimal/tsconfig.json"
sed -i '' 's/\("extends":\).*/\1 "..\/tsconfig.json",/g' "${DIR_EXAMPLES}/javascript/02_node_basic_api/tsconfig.json"
sed -i '' 's/\("extends":\).*/\1 "..\/tsconfig.json",/g' "${DIR_EXAMPLES}/javascript/03_node_client_api/tsconfig.json"
for filename in "lerna.json" "package.json" "tsconfig.json" "yarn.lock"; do
    git -C "${DIR_EXAMPLES}" checkout "${DIR_EXAMPLES}/javascript/${filename}"
done
