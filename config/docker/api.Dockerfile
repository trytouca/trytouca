# ---- builder stage ----

FROM node:18-alpine AS builder

COPY api/api /home

RUN apk add --no-cache yarn \
    && yarn --cwd=/home install --frozen-lockfile --production \
    && yarn --cwd=/home cache clean

# ---- builder stage ----

FROM node:18-alpine

LABEL maintainer="hello@touca.io"
LABEL org.opencontainers.image.title="touca-api"
LABEL org.opencontainers.image.description="Touca API"
LABEL org.opencontainers.image.url="https://api.touca.io/"
LABEL org.opencontainers.image.documentation="https://touca.io/docs"
LABEL org.opencontainers.image.vendor="Touca, Inc."
LABEL org.opencontainers.image.authors="hello@touca.io"

COPY api/certs                      /opt/touca/certs
COPY api/dist                       /opt/touca/dist
COPY api/env                        /opt/touca/env
COPY api/samples                    /opt/touca/samples
COPY --from=builder /home/node_modules  /opt/touca/node_modules

EXPOSE 8081

CMD ["node", "/opt/touca/dist/server.js"]
