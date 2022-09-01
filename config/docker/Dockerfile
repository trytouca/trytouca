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
    ca-certificates curl \
  && rm -rf /var/cache/apk/* \
  && mkdir -p /opt/touca/api/certs \
  && curl -o /opt/touca/api/certs/cert.pem https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem

COPY --from=builder_api /opt/touca/node_modules                 /opt/touca/node_modules
COPY --from=builder_api /opt/touca/packages                     /opt/touca/packages
COPY --from=builder_api /opt/touca/api/dist                     /opt/touca/api/dist
COPY --from=builder_api /opt/touca/api/env                      /opt/touca/api/env
COPY --from=builder_api /opt/touca/api/samples                  /opt/touca/api/samples
COPY --from=builder_api /opt/touca/api/node_modules             /opt/touca/api/node_modules
COPY --from=builder_app /opt/touca/app/dist                     /opt/touca/app/dist

EXPOSE 80

CMD ["node", "/opt/touca/api/dist/server.js"]
