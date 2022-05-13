#!/usr/bin/env bash
set -e

question () { printf "\e[1;36m#\e[m $@\\n"; }
answer () { printf "\e[1;33m\$\e[m "; }
info () { printf "\e[1;32m-\e[m $@\\n"; }
error () { printf "\e[1;31m-\e[m $@\\n"; return 1; }
answer_is_yes () {
    answer
    read -r response
    response=${response:=y}
    response=${response,,}
    [ "${response:0:1}" == 'y' ]
}

DIR_INSTALL_DEFAULT="$HOME/.touca/server"

info "Hi, Thank you for trying Touca!"
question "What is your first name?"
answer
read -r HUMAN_NAME
info "Nice to meet you, ${HUMAN_NAME:=stranger}!"

question "Where should we install Touca? Leave empty to use \e[1;36m$DIR_INSTALL_DEFAULT\e[m."
answer
read -r DIR_INSTALL
DIR_INSTALL=${DIR_INSTALL:=$DIR_INSTALL_DEFAULT}
FILE_COMPOSE="$DIR_INSTALL/repo/ops/docker-compose.prod.yml"
DIR_PROJECT_ROOT="$DIR_INSTALL"

if [ -d "$DIR_INSTALL/data" ]; then
    question "We found a previous install of Touca. Should we remove it with all its stored data? [y/n] Leave empty to say yes."
    if ! answer_is_yes; then
        info "This script only supports a fresh install."
        info "Use upgrade.sh if you like to keep your current data."
        info 'bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trytouca/trytouca/main/ops/upgrade.sh)"'
        error "Have a good day, $HUMAN_NAME!"
    fi
fi

info "Installing into ${DIR_INSTALL}..."
rm -rf "$DIR_INSTALL/repo"
mkdir -p "$DIR_INSTALL"
git clone https://github.com/trytouca/trytouca.git "$DIR_INSTALL/repo" &> /dev/null || true
source "$DIR_INSTALL/repo/ops/common.sh"

if ! is_command_installed "docker"; then
    info "We use Docker to install Touca server. We could not find it on your system."
    question "Would you like us to install it?"
    if ! answer_is_yes; then
        info "Welp, we cannot go ahead without Docker."
        error "Have a good day, $HUMAN_NAME!"
    fi
    info "Setting up Docker"
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo -E apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
    sudo apt update
    sudo apt-cache policy docker-ce
    sudo apt install -y docker-ce
    sudo usermod -aG docker "${USER}"
fi

if ! is_command_installed "docker-compose"; then
    info "We use docker-compose to install Touca server. We could not find it on your system."
    question "Would you like us to install it?"
    if ! answer_is_yes; then
        info "Welp, we cannot go ahead without docker-compose."
        error "Have a good day, $HUMAN_NAME!"
    fi
    sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose || true
    sudo chmod +x /usr/local/bin/docker-compose
fi

info "Stopping running containers"
run_compose stop >/dev/null 2>&1
info "Removing previous containers"
run_compose down >/dev/null 2>&1
info "Pruning docker resources"
if ! docker system prune --force >/dev/null 2>&1; then
    log_error "failed to prune docker resources"
fi

rm -rf "$DIR_INSTALL/{data,logs}"
mkdir -p "$DIR_INSTALL/logs/{backend,cmp}" "$DIR_INSTALL/data/{minio,mongo,redis}"
info "Pulling new docker images"
run_compose pull >/dev/null 2>&1
info "Starting new docker containers"
run_compose "up -d" >/dev/null 2>&1

info "Checking if containers are up"
CONNECTED=false
for num in {1..10}; do
    sleep 5
    OUTPUT=$(curl -s -X GET "http://localhost/api/platform")
    if [[ $OUTPUT == *"\"ready\":true"* ]]; then
        CONNECTED=true
        break
    fi
    info "Trying again in 5 seconds..."
done
if [ $CONNECTED = false ]; then
    info "Touca server did not pass our health checks in time."
    info "Feel free to rerun this script to make sure everything is fine."
    error "Have a good day, $HUMAN_NAME!"
fi
info "Touca server is up and running."
info "Browse to http://localhost/ to complete the installation."
info "Have a good day, $HUMAN_NAME!"
