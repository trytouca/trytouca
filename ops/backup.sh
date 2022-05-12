#!/usr/bin/env bash

# declare project structure

ARG_VERBOSE=0
DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_PROJECT_ROOT="$(dirname "${DIR_SCRIPT}")"
DIR_BACKUP="${DIR_PROJECT_ROOT}/backup"
FILE_COMPOSE="${DIR_PROJECT_ROOT}/ops/docker-compose.cloud.yml"

# include common helper functions

# shellcheck source=./common.sh
# shellcheck disable=SC1091
source "${DIR_PROJECT_ROOT}/ops/common.sh"

MONGO_USER=$(extract_secret "MONGO_USER")
MONGO_PASS=$(extract_secret "MONGO_PASS")
mkdir -p "${DIR_BACKUP}"
mongodump --db=touca -u "${MONGO_USER}" -p "${MONGO_PASS}" --archive="${DIR_BACKUP}/backup.gz" --gzip
aws s3 mv "${DIR_BACKUP}/backup.gz" s3://touca-backups/touca-io-backup-mongo-$(date +"%y%m%d").gz
