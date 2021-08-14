#!/usr/bin/env bash

# exit on error
set -e

# we assume this script is placed in the top-level cpp directory
dir_source="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# make sure cmake is installed
if ! hash "cmake" 2>/dev/null; then
    printf "\e[1;33m%-10s\e[m %s\\n" "warning" "cmake build system generator is not installed"
    exit 1
fi

# directory where build artifacts are generated
dir_build="${dir_source}/local/build"

# directory where build artifacts of interest are installed
# note: at this time, no cmake target has an install recipe
dir_install="${dir_source}/local/dist"

# comment out the line below to prevent rebuilding from scratch
rm -rf "${dir_build}"

# create build directory if it does not exist
mkdir -p "${dir_build}"

# configure the build system
cmake -B"${dir_build}" -H"${dir_source}" -G"Unix Makefiles" -DCMAKE_BUILD_TYPE="Release"

# run the build process
cmake --build "${dir_build}" --parallel

# move build artifacts of interest into the install directory
# note: at this time, no cmake target has an install recipe
cmake --install "${dir_build}" --prefix "${dir_install}"
