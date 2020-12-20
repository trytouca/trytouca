# ---- conan package ----

FROM ubuntu:bionic AS builder_main

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    apt-transport-https ca-certificates gnupg software-properties-common wget \
  && wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null \
    | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null \
  && apt-add-repository 'deb https://apt.kitware.com/ubuntu/ bionic main' \
  && apt-get install -y --no-install-recommends \
    cmake g++ gcc make python3-pip python3-setuptools \
  && rm -rf /var/lib/apt/lists/* \
  && pip3 install conan --no-cache-dir --upgrade \
  && cmake --version \
  && conan --version \
  && groupadd -r weasel && useradd -u 8002 -m --no-log-init -r -g weasel weasel

COPY . /opt

RUN chown -v -R weasel:weasel /opt

WORKDIR /opt

USER weasel

RUN conan profile new default --detect \
  && conan profile update settings.compiler.libcxx=libstdc++11 default \
  && ./build.sh --with-tests --with-utils --with-examples --with-framework

# ---- documentation ----

FROM alpine:3.8 AS builder_docs

RUN apk add --update --no-cache \
  bash doxygen python3 python3-dev \
  && pip3 install --no-cache-dir --upgrade pip \
  && pip3 install --upgrade --no-cache-dir \
    breathe m2r2 sphinx==3.2.1 sphinx-rtd-theme \
  && rm -rf /var/lib/apt/lists/*

COPY . /opt

WORKDIR /opt

RUN bash build.sh --docs

# ---- production ----

FROM scratch
LABEL maintainer="hello@getweasel.com"
LABEL org.opencontainers.image.title="weasel-cpp"
LABEL org.opencontainers.image.description="Weasel Client Library for C++"
LABEL org.opencontainers.image.url="https://getweasel.com/"
LABEL org.opencontainers.image.documentation="https://getweasel.com/docs/clients/cpp/index.html"
LABEL org.opencontainers.image.vendor="Pejman Ghrobanzade"
LABEL org.opencontainers.image.authors="hello@getweasel.io"
LABEL org.opencontainers.image.licenses="https://github.com/getweasel/weasel-cpp/blob/master/LICENSE"

COPY --from=builder_main    /opt/local/dist                   /opt/dist
COPY --from=builder_docs    /opt/local/docs/html              /opt/docs
COPY --from=builder_main    /home/weasel/.conan/data/weasel   /opt/conan/data/weasel
