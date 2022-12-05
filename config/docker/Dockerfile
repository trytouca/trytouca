# ---- builder stage (api) ----

FROM node:16-alpine AS builder_api

COPY api                    /opt/touca/api
COPY packages               /opt/touca/packages
COPY pnpm-lock.yaml         /opt/touca/pnpm-lock.yaml
COPY pnpm-workspace.yaml    /opt/touca/pnpm-workspace.yaml

RUN apk add --no-cache curl \
    && npm i -g pnpm \
    && mkdir -p /opt/touca/api/certs \
    && curl -o /opt/touca/api/certs/cert.pem https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem \
    && pnpm --dir=/opt/touca/api --filter=@touca/api --filter=@touca/api-schema --filter=@touca/comparator --filter=@touca/flatbuffers install --no-strict-peer-dependencies --ignore-scripts \
    && pnpm --dir=/opt/touca/api -r --filter=@touca/api --filter=@touca/api-schema --filter=@touca/comparator --filter=@touca/flatbuffers run build \
    && find /opt/touca -maxdepth 3 -name 'node_modules' -type d | xargs rm -rf \
    && pnpm --dir=/opt/touca/api  --filter=@touca/api --filter=@touca/api-schema --filter=@touca/comparator --filter=@touca/flatbuffers install --prod --no-strict-peer-dependencies --ignore-scripts

# ---- builder stage (app) ----

FROM node:16-alpine AS builder_app

COPY app                  /opt/touca/app
COPY packages             /opt/touca/packages
COPY pnpm-lock.yaml       /opt/touca/pnpm-lock.yaml
COPY pnpm-workspace.yaml  /opt/touca/pnpm-workspace.yaml

RUN apk add --no-cache bash gcc g++ make python3 \
    && npm i -g pnpm \
    && pnpm --dir=/opt/touca install --filter=@touca/app --frozen-lockfile --no-optional \
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
LABEL com.docker.desktop.extension.icon="https://touca.io/images/touca_logo_bgwt.png"

COPY --from=builder_api /opt/touca/node_modules         /opt/touca/node_modules
COPY --from=builder_api /opt/touca/packages             /opt/touca/packages
COPY --from=builder_api /opt/touca/api/certs            /opt/touca/api/certs
COPY --from=builder_api /opt/touca/api/dist             /opt/touca/api/dist
COPY --from=builder_api /opt/touca/api/env              /opt/touca/api/env
COPY --from=builder_api /opt/touca/api/package.json     /opt/touca/api/package.json
COPY --from=builder_api /opt/touca/api/node_modules     /opt/touca/api/node_modules
COPY --from=builder_api /opt/touca/api/samples          /opt/touca/api/samples
COPY --from=builder_app /opt/touca/app/dist             /opt/touca/app/dist

CMD ["node", "/opt/touca/api/dist/server.js"]
