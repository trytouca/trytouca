# ---- builder stage ----

FROM node:16-alpine AS builder

COPY api /opt/api
COPY packages /opt/packages
COPY pnpm-lock.yaml /opt/pnpm-lock.yaml
COPY pnpm-workspace.yaml /opt/pnpm-workspace.yaml

RUN apk add --no-cache curl \
    && npm i -g pnpm \
    && mkdir /opt/api/certs \
    && curl -o /opt/api/certs/cert.pem https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem \
    && pnpm --dir=/opt/api --filter=@touca/api --no-strict-peer-dependencies install \
    && pnpm --dir=/opt/api run build \
    && pnpm --dir=/opt/api run lint \
    && pnpm --dir=/opt/api run test \
    && rm -rf /opt/api/node_modules \
    && pnpm --dir=/opt/api --filter=@touca/api --frozen-lockfile --production install

# ---- production image ----

FROM node:16-alpine

COPY --from=builder /opt/api/certs         /opt/touca/certs
COPY --from=builder /opt/api/dist          /opt/touca/dist
COPY --from=builder /opt/api/env           /opt/touca/env
COPY --from=builder /opt/api/samples       /opt/touca/samples
COPY --from=builder /opt/api/node_modules  /opt/touca/node_modules
COPY --from=builder /opt/node_modules      /opt/node_modules

EXPOSE 8081

CMD ["node", "/opt/touca/dist/server.js"]
