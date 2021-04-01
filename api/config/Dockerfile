# ---- flatc ----

FROM ghorbanzade/flatc AS flatc

COPY config/flatbuffers/weasel.fbs /opt/

RUN /opt/flatc --ts --no-fb-import -o /opt /opt/weasel.fbs

# ---- build for development ----

FROM node:15-alpine AS build_dev_env

COPY backend /home

COPY --from=flatc /opt/weasel_generated.ts /home/src/utils/

RUN apk add --no-cache yarn \
    && yarn --cwd=/home install \
    && yarn --cwd=/home build \
    && yarn --cwd=/home lint \
    && yarn --cwd=/home test

# ---- build for production ----

FROM node:15-alpine AS build_prod_env

COPY --from=build_dev_env /home/dist /home/dist
COPY --from=build_dev_env /home/env /home/env
COPY --from=build_dev_env /home/package.json /home/package.json
COPY --from=build_dev_env /home/samples /home/samples

RUN apk add --no-cache yarn \
    && yarn --cwd=/home install --frozen-lockfile --production \
    && yarn --cwd=/home cache clean

# ---- production ----

FROM node:15-alpine

LABEL maintainer="hello@getweasel.com"
LABEL org.opencontainers.image.title="weasel-backend"
LABEL org.opencontainers.image.description="Weasel Server Backend"
LABEL org.opencontainers.image.url="https://getweasel.com/"
LABEL org.opencontainers.image.documentation="https://docs.getweasel.com"
LABEL org.opencontainers.image.vendor="Weasel, Inc."
LABEL org.opencontainers.image.authors="hello@getweasel.com"

EXPOSE 8081

COPY --from=build_prod_env /home/dist /opt/weasel/dist
COPY --from=build_prod_env /home/env /opt/weasel/env
COPY --from=build_prod_env /home/samples /opt/weasel/samples
COPY --from=build_prod_env /home/node_modules /opt/weasel/node_modules

CMD ["node", "/opt/weasel/dist/server.js"]
