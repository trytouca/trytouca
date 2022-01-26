#!/usr/bin/env bash

# declare project structure

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_PROJECT_ROOT="$(dirname "${DIR_SCRIPT}")"
DIR_LOGS="${DIR_PROJECT_ROOT}/local/logs"
DIR_DATA="${DIR_PROJECT_ROOT}/local/data"
FILE_COMPOSE="${DIR_PROJECT_ROOT}/config/docker/docker-compose.dev.yml"

# include common helper functions

# shellcheck source=./common.sh
# shellcheck disable=SC1091
source "${DIR_PROJECT_ROOT}/devops/common.sh"

for dir in "backend" "cmp"; do
    mkdir -p "${DIR_LOGS}/${dir}"
done

for dir in "minio" "mongo" "redis"; do
    mkdir -p "${DIR_DATA}/${dir}"
done

redeploy
