# ---- builder stage ----

FROM node:16-alpine AS builder

COPY api                    /opt/touca/api
COPY packages               /opt/touca/packages
COPY pnpm-lock.yaml         /opt/touca/pnpm-lock.yaml
COPY pnpm-workspace.yaml    /opt/touca/pnpm-workspace.yaml

RUN apk add --no-cache curl \
    && npm i -g pnpm \
    && mkdir -p /opt/touca/api/certs \
    && curl -o /opt/touca/api/certs/cert.pem https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem \
    && pnpm --dir=/opt/touca/api --filter=@touca/api-schema --filter=@touca/comparator --filter=@touca/flatbuffers --no-strict-peer-dependencies install \
    && pnpm --dir=/opt/touca/api run build \
    && pnpm --dir=/opt/touca/api run lint \
    && pnpm --dir=/opt/touca/api run test \
    && rm -rf /opt/touca/api/node_modules \
    && pnpm --dir=/opt/touca/api --frozen-lockfile install

# ---- production image ----

FROM node:16-alpine

COPY --from=builder /opt/touca/api/certs         /opt/touca/api/certs
COPY --from=builder /opt/touca/api/dist          /opt/touca/api/dist
COPY --from=builder /opt/touca/api/env           /opt/touca/api/env
COPY --from=builder /opt/touca/api/samples       /opt/touca/api/samples
COPY --from=builder /opt/touca/api/node_modules  /opt/touca/api/node_modules
COPY --from=builder /opt/touca/node_modules      /opt/touca/node_modules
COPY --from=builder /opt/touca/packages          /opt/touca/packages

EXPOSE 8081

CMD ["node", "/opt/touca/api/dist/server.js"]
