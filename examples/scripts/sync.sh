#!/usr/bin/env bash

set -o errexit -o pipefail -o noclobber -o nounset

__log () {
    if [ $# -lt 3 ]; then return 1; fi
    printf "\e[1;$2m%-10s\e[m %s\\n" "$1" "${@:3}"
}
log_info  () { __log 'info' '34' "$@"; }
log_warning () { __log 'warn' '33' "$@"; }
log_error () { __log 'error' '31' "$@"; return 1; }

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_PROJECT_ROOT="$(dirname $(dirname "${DIR_SCRIPT}"))"
DIR_CLIENTS="${DIR_PROJECT_ROOT}/sdk"
DIR_EXAMPLES="${DIR_PROJECT_ROOT}/examples"

run_sed () {
    if [ $# -ne 2 ]; then return 1; fi
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$2" "$1"
    else
        sed -i "$2" "$1"
    fi
}

sync_cpp () {
    local dir_examples="${DIR_EXAMPLES}"
    local dir_src="${DIR_CLIENTS}/cpp/examples"
    local dir_dst="${dir_examples}/cpp"
    rm -rf "${dir_dst}"
    cp -r "${dir_src}" "${dir_dst}"

    for filename in ".clang-format" ".dockerignore" "build.sh" "CMakeLists.txt" "Dockerfile" "cmake/external.cmake" "04_cpp_external_input"; do
        git checkout "${dir_dst}/${filename}"
    done
}

sync_python () {
    local dir_examples="${DIR_EXAMPLES}"
    local dir_src="${DIR_CLIENTS}/python/examples"
    local dir_dst="${dir_examples}/python"
    rm -rf "${dir_dst}"
    cp -r "${dir_src}" "${dir_dst}"

    rm "${dir_dst}/02_python_main_api/unit_test.py"
    for filename in "01_python_minimal/requirements.txt" "03_python_core_api/requirements.txt" "04_python_external_files"; do
        git checkout "${dir_dst}/${filename}"
    done
}

sync_js () {
    local dir_examples="${DIR_EXAMPLES}"
    local dir_src="${DIR_CLIENTS}/js/examples"
    local dir_dst="${dir_examples}/js"
    rm -rf "${dir_dst}"
    cp -r "${dir_src}" "${dir_dst}"

    for filename in "lerna.json" "package.json" "tsconfig.json" "yarn.lock"; do
        git checkout "${dir_dst}/${filename}"
    done
    for project in "01_node_minimal" "02_node_main_api" "03_node_core_api"; do
        run_sed "${dir_dst}/${project}/tsconfig.json" 's/\("extends":\).*/\1 "..\/tsconfig.json",/g'
        run_sed "${dir_dst}/${project}/package.json"  's/\("version":\).*/\1 "1.5.2",/g'
        run_sed "${dir_dst}/${project}/package.json"  's/\("@touca\/node":\).*/\1 "^1.5.2"/g'
    done
}

sync_java () {
    local dir_examples="${DIR_EXAMPLES}"
    local dir_src="${DIR_CLIENTS}/java/examples"
    local dir_dst="${dir_examples}/java"
    rm -rf "${dir_dst}"
    cp -r "${dir_src}" "${dir_dst}"

    for filename in "gradlew" "gradlew.bat" "build.gradle.kts" "gradle" "settings.gradle.kts"; do
        git checkout "${dir_dst}/${filename}"
    done
    for project in "01_java_minimal" "02_java_main_api" "03_java_core_api"; do
        run_sed "${dir_dst}/${project}/build.gradle.kts" 's/implementation.*/implementation("io.touca:touca:1.5.1")/g'
    done
}

sync_cpp
sync_python
sync_js
sync_java
