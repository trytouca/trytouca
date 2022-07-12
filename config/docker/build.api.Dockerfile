# ---- builder stage ----

FROM node:16-alpine AS builder_dev

COPY api /home

RUN apk add --no-cache curl \
    && mkdir /home/certs \
    && curl -o /home/certs/cert.pem https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem \
    && npm --prefix=/home install \
    && npm --prefix=/home run build \
    && npm --prefix=/home run lint \
    && npm --prefix=/home run test

# ---- builder stage ----

FROM node:16-alpine AS builder

COPY --from=builder_dev /home/certs             /home/certs
COPY --from=builder_dev /home/dist              /home/dist
COPY --from=builder_dev /home/env               /home/env
COPY --from=builder_dev /home/package.json      /home/package.json
COPY --from=builder_dev /home/samples           /home/samples

RUN npm --prefix=/home ci --omit=dev \
    && npm --prefix=/home cache clean

# ---- production image ----

FROM node:16-alpine

COPY --from=builder /home/certs         /opt/touca/certs
COPY --from=builder /home/dist          /opt/touca/dist
COPY --from=builder /home/env           /opt/touca/env
COPY --from=builder /home/samples       /opt/touca/samples
COPY --from=builder /home/node_modules  /opt/touca/node_modules

EXPOSE 8081

CMD ["node", "/opt/touca/dist/server.js"]
