# ---- build source code ----

FROM ubuntu:focal AS client_cpp_build

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    apt-transport-https ca-certificates gnupg software-properties-common wget \
  && wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null \
    | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null \
  && apt-add-repository 'deb https://apt.kitware.com/ubuntu/ focal main' \
  && apt-get install -y --no-install-recommends \
    cmake g++ gcc git make libssl-dev \
  && rm -rf /var/lib/apt/lists/* \
  && cmake --version \
  && groupadd -r touca && useradd -u 8002 -m --no-log-init -r -g touca touca

COPY . /opt

RUN chown -v -R touca:touca /opt

WORKDIR /opt

USER touca

RUN ./build.sh --with-tests --with-utils --with-examples --with-framework

# ---- client-cpp documentation ----

FROM alpine:3.12 AS client_cpp_docs

RUN apk add --update --no-cache bash doxygen cmd:pip3 \
  && pip3 install --no-cache-dir --upgrade pip \
  && pip3 install --upgrade --no-cache-dir breathe m2r2 sphinx sphinx-rtd-theme \
  && rm -rf /var/lib/apt/lists/*

COPY . /opt

RUN cd /opt && bash build.sh --docs

# ---- production ----

FROM scratch
LABEL maintainer="hello@touca.io"
LABEL org.opencontainers.image.title="touca-cpp"
LABEL org.opencontainers.image.description="Touca SDK for C++"
LABEL org.opencontainers.image.url="https://touca.io/"
LABEL org.opencontainers.image.documentation="https://docs.touca.io"
LABEL org.opencontainers.image.vendor="Touca, Inc."
LABEL org.opencontainers.image.authors="hello@touca.io"
LABEL org.opencontainers.image.licenses="https://github.com/trytouca/touca-cpp/blob/master/LICENSE"

COPY --from=client_cpp_build  /opt/local/dist      /opt/dist
COPY --from=client_cpp_docs   /opt/local/docs/html /opt/docs
