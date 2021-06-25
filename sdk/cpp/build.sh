#!/usr/bin/env bash

# show help message
show_usage () {
    cat << EOF
usage: $(basename "$0") [ -h | --long-options]
  -h, --help                shows this message
  --debug                   enable debug logs

  --with-tests              include client library unittests in build
  --with-utils              include client-side utility application in build
  --with-examples           include sample regression test tool in build
  --with-framework          include sample regression test framework in build
  --all                     include all components

  --docs                    build client library documentation
  --lint                    lint client library source code
  --clear                   remove build artifacts
  --test                    test client library components
  --coverage                generate code-coverage report
EOF
}

# configure bash environment
set -o errexit -o pipefail -o noclobber -o nounset

# declare project structure

ARG_VERBOSE=0
TOUCA_CLIENT_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
    if [ $# -ne 2 ]; then return 1; fi
    declare -A modes=${1#*=}
    local count_modes
    count_modes="$(count_keys_if_set "$(declare -p modes)")"
    if [ "$count_modes" -eq 0 ]; then
        log_error "build mode is not specified"
    elif [ "$count_modes" -gt 1 ]; then
        log_error "only one build mode can be specified"
    fi
    declare -A options=${2#*=}
    local count_options
    count_options="$(count_keys_if_set "$(declare -p options)")"
    if [ "${modes["build"]}" -eq 0 ] && [ "${modes["coverage"]}" -eq 0 ] && [ "$count_options" -ne 0 ]; then
        log_error "build mode does not support specified options"
    fi
}

build_components () {
    if [ $# -ne 2 ]; then return 1; fi
    declare -A modes=${1#*=}
    for K in "${!modes[@]}"; do
        if [ "${modes[$K]}" -eq 0 ]; then continue; fi
        local func_name="build_${K//'-'/'_'}"
        if ! has_function "${func_name}"; then
            log_error "build mode not supported"
        fi
        ($func_name "$2")
    done
}

# build recipes

build_build () {
    if [ $# -ne 1 ]; then return 1; fi
    declare -A options=${1#*=}
    if [ "${#options[@]}" -ne 0 ]; then
        log_debug "building with the following options:"
        for K in "${!options[@]}"; do
            if [ "${options[$K]}" -eq 1 ]; then
                log_debug " - $K"
            fi
        done
    fi
    check_prerequisite_commands "cmake"

    local dir_source="${TOUCA_CLIENT_ROOT_DIR}"
    local dir_build="${dir_source}/local/build"
    local dir_install="${dir_source}/local/dist"

    mkdir -p "${dir_build}"
    mkdir -p "${dir_install}"

    if case $OSTYPE in linux* | darwin*) false;; *) true;; esac; then
        log_error "recipe not implemented for windows."
    fi

    local buildtype
    buildtype=$([ "${options["with-coverage"]}" -eq 1 ] \
        && echo "Debug" || echo "Release")

    local cmake_generator="Unix Makefiles"
    if is_command_installed "ninja"; then
        cmake_generator="Ninja"
    fi

    local cmake_config_optional_args=()
    if is_command_installed "ccache"; then
        log_debug "using ccache"
        cmake_config_optional_args+=(
            -DCMAKE_C_COMPILER_LAUNCHER=ccache
            -DCMAKE_CXX_COMPILER_LAUNCHER=ccache
        )
    fi

    local cmake_config_general_args=(
        -B"${dir_build}"
        -H"${dir_source}"
        -G"${cmake_generator}"
        -DCMAKE_BUILD_TYPE="${buildtype}"
        "${cmake_config_optional_args[@]}"
    )
    if [ "${options["with-coverage"]}" ]; then
        cmake_config_general_args+=("-DCMAKE_DEBUG_POSTFIX=_debug")
    fi

    local cmake_config_touca_args=(
        -DTOUCA_BUILD_TESTS="$(cmake_option "with-tests")"
        -DTOUCA_BUILD_UTILS="$(cmake_option "with-utils")"
        -DTOUCA_BUILD_EXAMPLES="$(cmake_option "with-examples")"
        -DTOUCA_BUILD_FRAMEWORK="$(cmake_option "with-framework")"
        -DTOUCA_BUILD_COVERAGE_REPORT="$(cmake_option "with-coverage")"
    )

    # we specify option `with_tests` to force conan to pull dependencies
    # for all targets.
    if is_command_installed "conan"; then
        log_info "fetching dependencies for cpp components"
        if [ ! -f "${dir_build}/conaninfo.txt" ]; then
            conan install -o with_tests=True -o with_framework=True \
                --install-folder "${dir_build}" \
                "${dir_source}/conanfile.py" --build=missing
        fi
    fi

    log_info "building cpp components using local toolchain"
    cmake "${cmake_config_general_args[@]}" "${cmake_config_touca_args[@]}"
    cmake --build "${dir_build}" --parallel
    cmake --install "${dir_build}" --prefix "${dir_install}"
    log_info "built specified cpp component(s)"
}

build_coverage () {
    if [ $# -ne 1 ]; then return 1; fi
    local dir_source="${TOUCA_CLIENT_ROOT_DIR}"
    local dir_build="${dir_source}/local/build"
    local dir_test="${dir_source}/local/tests"
    # check_prerequisite_commands "llvm-profdata" "llvm-cov"
    log_info "building coverage report for cpp client library"

    build_build "$1"

    local dir_bin="${dir_build}/bin"
    declare -a keys=("client" "framework")
    declare -A exclude_directory=(
        ["client"]="framework\/.+"
        ["framework"]="src\/.+")
    for key in "${keys[@]}"; do
      local dir_key="${dir_test}/${key,,}"
      local path_llvm_raw="${dir_key}/touca-${key,,}.profraw"
      local path_llvm_data="${dir_key}/touca-${key,,}.profdata"
      local path_report_stdout="${dir_key}/touca-${key,,}.stdout"
      local file_bin="${dir_bin}/touca_${key}_tests_debug"
      mkdir -p "$(dirname "${path_llvm_raw}")"
      log_info "running unittest ${file_bin}"
      LLVM_PROFILE_FILE="${path_llvm_raw}" "${file_bin}"
      xcrun llvm-profdata merge -sparse "${path_llvm_raw}" -o "${path_llvm_data}"
      xcrun llvm-cov show "${file_bin}" \
          -instr-profile="${path_llvm_data}" \
          -format=html -o "${dir_key}" \
          --ignore-filename-regex=".+_generated.h" \
          --ignore-filename-regex="tests\/.+" \
          --ignore-filename-regex="${exclude_directory[${key,,}]}"
      xcrun llvm-cov report "${file_bin}" \
          -instr-profile="${path_llvm_data}" >| "${path_report_stdout}"
      log_info "generated code-coverage report for cpp components (${key,,})"
    done
    remove_file_if_exists "${dir_build}/CMakeCache.txt"
    log_info "done generating code-coverage report for cpp components"
}

build_lint () {
    if [ $# -ne 1 ]; then return 1; fi
    check_prerequisite_commands "clang-format"
    local dir_source="${TOUCA_CLIENT_ROOT_DIR}"
    for dir in "utils" "framework" "src" "include" "tests" "example"; do
        find "${dir_source}/${dir}" \( -name "*.cpp" -o -name "*.hpp" -o -name "*.h" \) \
            -exec clang-format -i {} +
    done
    log_info "ran clang-format on cpp client source code"
}

build_package () {
    local dir_source="${TOUCA_CLIENT_ROOT_DIR}"
    local dir_build="${dir_source}/local/build"
    local dir_export_pkg="${dir_build}/conan-export-pkg"

    mkdir -p "${dir_export_pkg}"
    conan export-pkg -if "${dir_build}" \
        -bf "${dir_export_pkg}" \
        -f "${dir_source}"
    log_info "created conan package"
}

build_clear () {
    if [ $# -ne 1 ]; then return 1; fi
    local dir_source="${TOUCA_CLIENT_ROOT_DIR}"
    remove_dir_if_exists "${dir_source}/local/build"
    remove_dir_if_exists "${dir_source}/local/dist"
    remove_dir_if_exists "${dir_source}/local/docs"
    remove_dir_if_exists "${dir_source}/local/tests"
}

build_docs () {
    if [ $# -ne 1 ]; then return 1; fi
    local dir_source="${TOUCA_CLIENT_ROOT_DIR}"
    local config_dir_doxygen="${dir_source}/docs/doxygen"
    local config_dir_sphinx="${dir_source}/docs/sphinx"
    local dir_dst="${dir_source}/local/docs"
    local dir_out="${dir_dst}/html"
    remove_dir_if_exists "$dir_dst"
    log_info "building cpp client library documentation using local toolchain"
    check_prerequisite_commands "doxygen" "sphinx-build"
    mkdir -p "$(dirname "${dir_dst}")"
    doxygen "${config_dir_doxygen}/Doxyfile"
    sphinx-build -b html -c "${config_dir_sphinx}" "${config_dir_sphinx}" "${dir_out}"
    if [ -d "$dir_dst" ]; then
        log_info "built cpp client library documentation using local toolchain"
        return 0
    fi
    log_error "failed to build client library documentation"
}

build_test () {
    if [ $# -ne 1 ]; then return 1; fi
    local dir_source="${TOUCA_CLIENT_ROOT_DIR}"
    cd "${dir_source}/local/build" && ctest "${dir_source}" -C Release && cd "$(pwd)"
    log_info "ran unittests for cpp client library"
}

# check command line arguments

ARG_HELP=0

declare -A BUILD_MODES=(
    ["build"]=1
    ["docs"]=0
    ["clear"]=0
    ["coverage"]=0
    ["lint"]=0
    ["package"]=0
    ["test"]=0
)
declare -A BUILD_OPTIONS=(
    ["with-tests"]=0
    ["with-utils"]=0
    ["with-examples"]=0
    ["with-framework"]=0
    ["with-coverage"]=0
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
        "--docs")
            BUILD_MODES["build"]=0
            BUILD_MODES["docs"]=1
            ;;
        "--clear")
            BUILD_MODES["build"]=0
            BUILD_MODES["clear"]=1
            ;;
        "--coverage")
            BUILD_MODES["build"]=0
            BUILD_MODES["coverage"]=1
            BUILD_OPTIONS["with-tests"]=1
            BUILD_OPTIONS["with-framework"]=1
            BUILD_OPTIONS["with-coverage"]=1
            ;;
        "--lint")
            BUILD_MODES["build"]=0
            BUILD_MODES["lint"]=1
            ;;
        "--package")
            BUILD_MODES["build"]=0
            BUILD_MODES["package"]=1
            ;;
        "--test")
            BUILD_MODES["build"]=0
            BUILD_MODES["test"]=1
            ;;

        "-a" | "--all")
            BUILD_OPTIONS["with-utils"]=1
            BUILD_OPTIONS["with-framework"]=1
            BUILD_OPTIONS["with-examples"]=1
            BUILD_OPTIONS["with-tests"]=1
            ;;
        "--with-tests")
            BUILD_OPTIONS["with-tests"]=1
            ;;
        "--with-utils")
            BUILD_OPTIONS["with-utils"]=1
            ;;
        "--with-examples")
            BUILD_OPTIONS["with-examples"]=1
            ;;
        "--with-framework")
            BUILD_OPTIONS["with-framework"]=1
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

validate_arguments "$(declare -p BUILD_MODES)" "$(declare -p BUILD_OPTIONS)"
build_components   "$(declare -p BUILD_MODES)" "$(declare -p BUILD_OPTIONS)"
