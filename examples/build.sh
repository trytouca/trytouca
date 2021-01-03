#!/usr/bin/env bash

# we assume this script is placed in the top-level cpp directory
dir_source="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# make sure cmake is installed
if ! hash "cmake" 2>/dev/null; then
    printf "\e[1;33m%-10s\e[m %s\\n" "warning" "cmake build system generator is not installed"
    exit 1
fi

# make sure conan is installed
if ! hash "conan" 2>/dev/null; then
    printf "\e[1;33m%-10s\e[m %s\\n" "warning" "conan package manager is not installed"
    printf "\e[1;33mwarning   \e[m run the following set of commands to install conan\\n"
    printf "\e[1;34m pip install conan --no-cache-dir --upgrade \e[m\\n"
    printf "\e[1;34m conan profile new default --detect --force \e[m\\n"
    printf "\e[1;34m conan profile update settings.compiler.libcxx=libstdc++11 default \e[m\\n"
    exit 1
fi

# make sure weasel remote repository is added to conan remotes
if ! conan remote list | grep -q 'conan/getweasel/weasel-cpp'; then
    printf "\e[1;33m%-10s\e[m %s\\n" "warning" "conan remote list is missing the weasel repository"
    printf "\e[1;33mwarning   \e[m run the command below to add this repository to your conan remote list\\n"
    printf "\e[1;34m conan remote add weasel-conan https://api.bintray.com/conan/getweasel/weasel-cpp \e[m\\n"
    exit 1
fi

# directory where build artifacts are generated
dir_build="${dir_source}/local/build"

# directory where build artifacts of interest are installed
# note: at this time, no cmake target has an install recipe
dir_install="${dir_source}/local/dist"

# uncomment the line below to force rebuild from scratch
# rm -rf "${dir_build}"

# create build directory if it does not exist
mkdir -p "${dir_build}"

# if this is the first time we are building this project,
# install the weasel/1.2.1 dependency using conan
if [ ! -f "${dir_build}/conanbuildinfo.txt" ]; then
    conan install -if "${dir_build}" -g cmake_find_package -b missing -o with_framework=True "weasel/1.2.1@_/_"
fi

# configure the build system
cmake -B"${dir_build}" -H"${dir_source}" -G"Unix Makefiles" -DCMAKE_BUILD_TYPE="Release"

# run the build process
cmake --build "${dir_build}" --parallel

# move build artifacts of interest into the install directory
# note: at this time, no cmake target has an install recipe
cmake --install "${dir_build}" --prefix "${dir_install}"
