#!/usr/bin/env bash

# show help message
show_usage () {
    cat << EOF
usage: $(basename "$0") [ -h | --long-options]
  -h, --help                shows this message
  --debug                   enable debug logs

  --lint                    lint client library source code
  --clear                   remove build artifacts
EOF
}

# configure bash environment
set -o errexit -o pipefail -o noclobber -o nounset

# declare project structure

ARG_VERBOSE=0
TOUCA_COMPARATOR_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

if [ "${BASH_VERSINFO[0]}" -lt 4 ] || ( [ "${BASH_VERSINFO[0]}" -eq 4 ] && \
    [ "${BASH_VERSINFO[1]}" -lt 4 ] ); then
    log_warning "you are using bash version ${BASH_VERSION}"
    log_error "this script requires bash version 4.4 or higher"
fi

# helper funcitons

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

cmake_option () {
    if [ $# -ne 1 ]; then return 1; fi
    [ "${BUILD_OPTIONS["$1"]}" -eq 1 ] && echo "ON" || echo "OFF"
}

# more specific helper functions

validate_arguments () {
    if [ $# -ne 1 ]; then return 1; fi
    declare -A modes=${1#*=}
    local count_modes
    count_modes="$(count_keys_if_set "$(declare -p modes)")"
    if [ "$count_modes" -eq 0 ]; then
        log_error "build mode is not specified"
    elif [ "$count_modes" -gt 1 ]; then
        log_error "only one build mode can be specified"
    fi
}

build_components () {
    if [ $# -ne 1 ]; then return 1; fi
    declare -A modes=${1#*=}
    for K in "${!modes[@]}"; do
        if [ "${modes[$K]}" -eq 0 ]; then continue; fi
        local func_name="build_${K//'-'/'_'}"
        if ! has_function "${func_name}"; then
            log_error "build mode not supported"
        fi
        ($func_name)
    done
}

# build recipes

build_build () {
    if [ $# -ne 0 ]; then return 1; fi
    check_prerequisite_commands "cmake" "conan"

    local dir_source="${TOUCA_COMPARATOR_ROOT_DIR}"
    local dir_build="${dir_source}/local/build"
    local dir_install="${dir_source}/local/dist"
    local buildtype="Release"

    mkdir -p "${dir_build}"
    mkdir -p "${dir_install}"

    if case $OSTYPE in linux* | darwin*) false;; *) true;; esac; then
        log_error "recipe not implemented for windows."
    fi

    local cmake_generator="Unix Makefiles"
    if is_command_installed "ninja"; then
        cmake_generator="Ninja"
    fi

    local cmake_config_ccache_args=()
    if is_command_installed "ccache"; then
        log_debug "using ccache"
        cmake_config_ccache_args+=(
            -DCMAKE_C_COMPILER_LAUNCHER=ccache
            -DCMAKE_CXX_COMPILER_LAUNCHER=ccache
        )
    fi

    local cmake_config_general_args=(
        -B"${dir_build}"
        -H"${dir_source}"
        -G"${cmake_generator}"
        -DCMAKE_BUILD_TYPE="${buildtype}"
        "${cmake_config_ccache_args[@]}"
    )

    log_info "fetching dependencies for cpp components"
    if [ ! -f "${dir_build}/conaninfo.txt" ]; then
        conan install --install-folder "${dir_build}" \
            "${dir_source}/conanfile.py" --build=missing \
            --conf tools.system.package_manager:mode=install \
            --conf tools.system.package_manager:sudo=True
    fi

    log_info "building cpp components using local toolchain"
    cmake "${cmake_config_general_args[@]}"
    cmake --build "${dir_build}" --parallel
    cmake --install "${dir_build}" --prefix "${dir_install}"
    log_info "built specified cpp component(s)"
}

build_lint () {
    if [ $# -ne 0 ]; then return 1; fi
    check_prerequisite_commands "clang-format"
    local dir_source="${TOUCA_COMPARATOR_ROOT_DIR}"
    for dir in "src" "docs"; do
        find "${dir_source}/${dir}" \( -name "*.cpp" -o -name "*.hpp" -o -name "*.h" \) \
            -exec clang-format -i {} +
    done
    log_info "ran clang-format on comparator source code"
}

build_clear () {
    if [ $# -ne 0 ]; then return 1; fi
    local dir_source="${TOUCA_COMPARATOR_ROOT_DIR}"
    remove_dir_if_exists "${dir_source}/local/build"
    remove_dir_if_exists "${dir_source}/local/dist"
}

# check command line arguments

ARG_HELP=0

declare -A BUILD_MODES=(
    ["build"]=1
    ["clear"]=0
    ["lint"]=0
)

for arg in "$@"; do
    case $arg in
        "")
            ;;
        "-h" | "help" | "--help")
            ARG_HELP=1
            ;;
        "--debug")
            ARG_VERBOSE=1
            ;;

        "--build")
            ;;
        "--clear")
            BUILD_MODES["build"]=0
            BUILD_MODES["clear"]=1
            ;;
        "--lint")
            BUILD_MODES["build"]=0
            BUILD_MODES["lint"]=1
            ;;
        *)
            log_warning "invalid argument $arg"
            show_usage
            exit
            ;;
    esac
done

if [[ ${ARG_HELP} -eq 1 ]]; then
    show_usage
    exit
fi

validate_arguments "$(declare -p BUILD_MODES)"
build_components   "$(declare -p BUILD_MODES)"
