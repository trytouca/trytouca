# ---- builder stage ----

FROM node:16-alpine AS builder

COPY api                    /opt/touca/api
COPY app                    /opt/touca/app
COPY packages               /opt/touca/packages
COPY pnpm-lock.yaml         /opt/touca/pnpm-lock.yaml
COPY pnpm-workspace.yaml    /opt/touca/pnpm-workspace.yaml

RUN apk add --no-cache curl bash gcc g++ make python3 \
    && npm i -g pnpm \
    && mkdir -p /opt/touca/api/certs \
    && curl -o /opt/touca/api/certs/cert.pem https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem \
    && pnpm --dir=/opt/touca install --no-strict-peer-dependencies \
    && pnpm --dir=/opt/touca/api run build \
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

COPY --from=builder /opt/touca/node_modules                 /opt/touca/node_modules
COPY --from=builder /opt/touca/packages                     /opt/touca/packages
COPY --from=builder /opt/touca/api/certs                    /opt/touca/api/certs
COPY --from=builder /opt/touca/api/dist                     /opt/touca/api/dist
COPY --from=builder /opt/touca/api/env                      /opt/touca/api/env
COPY --from=builder /opt/touca/api/samples                  /opt/touca/api/samples
COPY --from=builder /opt/touca/api/node_modules             /opt/touca/api/node_modules
COPY --from=builder /opt/touca/app/dist                     /opt/touca/app/dist

CMD ["node", "/opt/touca/api/dist/server.js"]
