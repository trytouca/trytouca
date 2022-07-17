# ---- builder stage (api) ----

FROM node:16-alpine AS builder_api

RUN apk add --no-cache \
    curl \
  && npm i -g pnpm

COPY api                  /opt/touca/api
COPY packages             /opt/touca/packages
COPY pnpm-lock.yaml       /opt/touca/pnpm-lock.yaml
COPY pnpm-workspace.yaml  /opt/touca/pnpm-workspace.yaml

RUN pnpm --dir=/opt/touca install --filter=@touca/api \
    --no-strict-peer-dependencies \
  && pnpm --dir=/opt/touca/api run build \
  && rm -rf /opt/touca/api/node_modules \
  && pnpm --dir=/opt/touca install --filter=@touca/api \
    --lockfile-dir /opt/touca --frozen-lockfile --production

# ---- builder stage (app) ----

FROM node:16-alpine AS builder_app

RUN apk add --no-cache \
    bash gcc g++ make python3 \
  && npm i -g pnpm

COPY app                  /opt/touca/app
COPY packages             /opt/touca/packages
COPY pnpm-lock.yaml       /opt/touca/pnpm-lock.yaml
COPY pnpm-workspace.yaml  /opt/touca/pnpm-workspace.yaml

RUN pnpm --dir=/opt/touca install --filter=@touca/app \
    --lockfile-dir /opt/touca --frozen-lockfile --no-optional \
  && pnpm --dir=/opt/touca/app run build

# ---- builder stage (cmp) ----

FROM alpine:3.16 AS builder_cpp

RUN apk add --update --no-cache \
    bash build-base cmake make gcc g++ \
    libfontenc-dev libice-dev libsm-dev libstdc++ libx11-dev libxaw-dev \
    libxcomposite-dev libxcursor-dev libxdamage-dev linux-headers \
    libxi-dev libxinerama-dev libxkbfile-dev libxrandr-dev libxres-dev \
    libxscrnsaver-dev libxtst-dev libxv-dev libxvmc-dev libxxf86vm-dev \
    openssl openssl-dev perl py3-pip python3 \
    xcb-util-image-dev xcb-util-wm-dev xcb-util-keysyms-dev \
    xcb-util-renderutil-dev xkeyboard-config \
  && rm -rf /var/cache/apk/*

COPY cmp /opt/touca/cmp

RUN python3 -m pip install conan \
  && conan profile new default --detect \
  && conan profile update settings.compiler.libcxx=libstdc++11 default \
  && conan remote add --force touca-cpp https://getweasel.jfrog.io/artifactory/api/conan/touca-cpp \
  && /opt/touca/cmp/build.sh

# ---- production image ----

FROM node:16-alpine

LABEL org.opencontainers.image.title="touca"
LABEL org.opencontainers.image.description="Touca Server"
LABEL org.opencontainers.image.url="https://touca.io/"
LABEL org.opencontainers.image.documentation="https://touca.io/docs"
LABEL org.opencontainers.image.vendor="Touca, Inc."
LABEL org.opencontainers.image.authors="hello@touca.io"
LABEL com.docker.extension.publisher-url="https://touca.io"
LABEL com.docker.desktop.extension.icon="https://touca.io/logo/touca-logo-w-text-bg.png"

RUN apk add --no-cache --update \
    bash ca-certificates curl libstdc++ nginx \
  && rm -rf /var/cache/apk/* \
  && mkdir /var/log/cmp \
  && mkdir -p /opt/touca/api/certs \
  && curl -o /opt/touca/api/certs/cert.pem https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem

RUN sed -i \
  -e 's/#access_log  logs\/access.log  main;/access_log \/dev\/stdout;/' \
  -e 's/#error_log  logs\/error.log  notice;/error_log stderr notice;/' \
  /etc/nginx/nginx.conf

COPY --from=builder_api /opt/touca/node_modules                 /opt/touca/node_modules
COPY --from=builder_api /opt/touca/api/dist                     /opt/touca/api/dist
COPY --from=builder_api /opt/touca/api/env                      /opt/touca/api/env
COPY --from=builder_api /opt/touca/api/samples                  /opt/touca/api/samples
COPY --from=builder_api /opt/touca/api/node_modules             /opt/touca/api/node_modules
COPY --from=builder_app /opt/touca/app/dist                     /www/data/app
COPY --from=builder_app /opt/touca/app/nginx.conf               /etc/nginx/conf.d/default.conf
COPY --from=builder_cpp /opt/touca/cmp/local/dist               /opt/touca/cmp/local/dist
COPY --from=builder_cpp /opt/touca/cmp/config/config.prod.json  /opt/touca/cmp/config/config.json
COPY config/docker/experimental-init.sh                         /opt/touca/config/docker/experimental-init.sh

EXPOSE 80

CMD ["/bin/bash", "/opt/touca/config/docker/experimental-init.sh"]
