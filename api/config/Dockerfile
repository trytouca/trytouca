# ---- flatc ----

FROM ghorbanzade/flatc AS flatc

COPY config/flatbuffers/weasel.fbs /opt/

RUN /opt/flatc --ts --no-fb-import -o /opt /opt/weasel.fbs

# ---- builder ----

FROM node:15-alpine AS builder

COPY backend /home

COPY --from=flatc /opt/weasel_generated.ts /home/src/utils/

RUN apk add --no-cache g++ make python yarn \
    && yarn --cwd=/home install \
    && yarn --cwd=/home build \
    && rm -rf /home/node_modules \
    && yarn --cwd=/home install --frozen-lockfile --production \
    && yarn --cwd=/home cache clean

# ---- production ----

FROM node:15-alpine

LABEL maintainer="hello@getweasel.com"
EXPOSE 8081

COPY --from=builder /home/dist /opt/weasel/dist
COPY --from=builder /home/env /opt/weasel/env
COPY --from=builder /home/samples /opt/weasel/samples
COPY --from=builder /home/node_modules /opt/weasel/node_modules

CMD ["node", "/opt/weasel/dist/server.js"]
