# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

FROM ubuntu:22.04

LABEL maintainer="hello@touca.io"
LABEL org.opencontainers.image.title="touca-cpp-examples"
LABEL org.opencontainers.image.description="Sample Touca Test Tools for C++"
LABEL org.opencontainers.image.url="https://touca.io/"
LABEL org.opencontainers.image.documentation="https://touca.io/docs"
LABEL org.opencontainers.image.vendor="Touca, Inc."
LABEL org.opencontainers.image.authors="hello@touca.io"
LABEL org.opencontainers.image.licenses="https://github.com/trytouca/trytouca/blob/main/sdk/cpp/LICENSE"

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    apt-transport-https ca-certificates gnupg software-properties-common wget sudo \
  && wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null \
    | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null \
  && apt-add-repository 'deb https://apt.kitware.com/ubuntu/ jammy main' \
  && apt-get install -y --no-install-recommends \
    cmake g++ gcc git make libssl-dev vim \
  && rm -rf /var/lib/apt/lists/* \
  && cmake --version \
  && groupadd -r touca \
  && useradd --create-home --no-log-init --system --gid touca touca \
  && usermod -aG sudo touca \
  && echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers \
  && echo '[ ! -z "$TERM" -a -r /etc/motd ] && cat /etc/motd' >> /etc/bash.bashrc \
  && echo "\n" \
    "This container serves as a development environment and playground  \n" \
    "for the C++ SDK examples.                                          \n" \
    "The test tools are built and installed in \"/opt/local/dist/bin\"  \n" \
    "and \"/usr/bin/local\". The following is an example of how to run  \n" \
    "one of these test tools:                                           \n" \
    "                                                                   \n" \
    "  example_cpp_main_api --api-key <TOUCA_API_KEY>                   \n" \
    "                       --api-url <TOUCA_API_URL>                   \n" \
    "                       --revision <TOUCA_TEST_VERSION>             \n" \
    "                       --testcase alice                            \n" \
    "                                                                   \n" \
    "Run \"example_cpp_main_api --help\" for a list of all supported    \n" \
    "command line options. Use the \"build.sh\" script to rebuild the   \n" \
    "test tools if you liked to make changes to the source code.        \n" \
    "You can use \"sudo\" without a password to install missing         \n" \
    "packages after running \"sudo apt update\".                        \n" \
    >> /etc/motd

COPY . /opt

RUN chown -v -R touca:touca /opt

WORKDIR /opt

USER touca:touca

RUN ./build.sh && sudo cmake --install local/build
