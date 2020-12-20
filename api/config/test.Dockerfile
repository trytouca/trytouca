# ---- flatc ----

FROM ghorbanzade/flatc AS flatc

COPY config/flatbuffers/weasel.fbs /opt/

RUN /opt/flatc --ts --no-fb-import -o /opt /opt/weasel.fbs

# ---- builder ----

FROM node:13-alpine AS backend_builder

COPY backend /home

COPY --from=flatc /opt/weasel_generated.ts /home/src/utils/

RUN apk add --no-cache yarn \
    && yarn --cwd=/home install \
    && yarn --cwd=/home build \
    && yarn --cwd=/home cache clean
