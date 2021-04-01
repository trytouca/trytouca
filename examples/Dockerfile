#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

FROM ubuntu:focal

LABEL maintainer="hello@getweasel.com"
LABEL org.opencontainers.image.title="weasel-examples"
LABEL org.opencontainers.image.description="Sample Regression Test Tools using Weasel"
LABEL org.opencontainers.image.url="https://getweasel.com/"
LABEL org.opencontainers.image.documentation="https://docs.getweasel.com"
LABEL org.opencontainers.image.vendor="Weasel, Inc."
LABEL org.opencontainers.image.authors="hello@getweasel.com"
LABEL org.opencontainers.image.licenses="https://github.com/getweasel/examples/blob/master/LICENSE"

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    apt-transport-https ca-certificates gnupg software-properties-common wget sudo \
  && wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null \
    | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null \
  && apt-add-repository 'deb https://apt.kitware.com/ubuntu/ focal main' \
  && apt-get install -y --no-install-recommends \
    cmake g++ gcc git make libssl-dev \
  && rm -rf /var/lib/apt/lists/* \
  && cmake --version \
  && groupadd -r getweasel \
  && useradd --create-home --no-log-init --system --gid getweasel weasel \
  && usermod -aG sudo weasel \
  && echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers \
  && echo '[ ! -z "$TERM" -a -r /etc/motd ] && cat /etc/motd' >> /etc/bash.bashrc \
  && echo "\n" \
    "This container serves as a development environment and playground for the     \n" \
    "\"getweasel/examples\" repository. The regression test tools are built and    \n" \
    "installed in \"/opt/local/dist/bin\" and \"/usr/bin/local\". The following is \n" \
    "an example of how to run one of these test tool:                              \n" \
    "                                                                          \n" \
    "  weasel_example_advanced -c advanced/config.json -r <YOUR_VERSION>       \n" \
    "              --api-key <WEASEL_API_KEY> --api-url <WEASEL_API_URL>       \n" \
    "                                                                          \n" \
    "Run "weasel_example_advanced --help" for a list of all supported command  \n" \
    "line options. Use the "build.sh" script to rebuild the test tools if you  \n" \
    "liked to make changes to the source code.                                 \n" \
    "You can use \"sudo\" without a password.                                  \n" \
    >> /etc/motd

COPY . /opt

RUN chown -v -R weasel:getweasel /opt

WORKDIR /opt

USER weasel:getweasel

RUN ./build.sh && sudo cmake --install local/build
