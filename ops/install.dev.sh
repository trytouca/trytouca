#!/usr/bin/env bash
set -e

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$DIR_SCRIPT/common.sh"

ask_install_dir
DIR_INSTALL=$OUTPUT

# run_compose makes use of the following variables
FILE_COMPOSE="$DIR_SCRIPT/docker-compose.dev.yml"
DIR_PROJECT_ROOT="$DIR_INSTALL"

# mongo requires a keyfile to run in replica mode.
FILE_KEYFILE="$DIR_SCRIPT/mongo/keyFile.txt"

confirm_data_removal

install_docker
install_docker_compose

rm -rf "$DIR_INSTALL"/{data,logs,ops}
mkdir -p "$DIR_INSTALL"/data/{minio,mongo,redis} "$DIR_INSTALL"/ops

generate_keyfile

cp -r "$(dirname "${DIR_SCRIPT}")"/ops/mongo "$DIR_INSTALL"/ops

redeploy
info "Have a good day, stranger!"
