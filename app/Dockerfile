# ---- website (production version) ----

FROM node:15-alpine as website_builder

RUN apk add --no-cache bash

COPY web /opt/web

RUN  yarn --cwd /opt/web install --frozen-lockfile \
  && yarn --cwd /opt/web cache clean \
  && yarn --cwd /opt/web run next telemetry \
  && yarn --cwd /opt/web build

# ---- webapp (production version) ----

FROM node:15-alpine as webapp_builder

RUN apk add --no-cache bash

COPY frontend /opt/frontend

RUN yarn --cwd /opt/frontend install --frozen-lockfile \
  && yarn --cwd /opt/frontend cache clean \
  && yarn --cwd /opt/frontend build --prod

# ---- api documentation ----

FROM node:15-alpine as doc_api_builder

RUN yarn global add redoc-cli swagger-inline

COPY backend /opt/backend

RUN mkdir -p /opt/backend/local/docs/backend \
    && swagger-inline \
        /opt/backend/src/routes/*.ts \
        /opt/backend/src/commontypes.ts \
        --base /opt/backend/docs/swagger.base.yaml \
        --format yaml > /opt/backend/local/docs/backend/swagger.yaml \
    && redoc-cli bundle /opt/backend/local/docs/backend/swagger.yaml \
        --options.hideDownloadButton=true \
        --output=/opt/backend/local/docs/backend/index.html \
        --title="Weasel Platform API Documentation"

# ---- flatc ----

FROM ghorbanzade/flatc AS flatc

COPY config/flatbuffers/weasel.fbs /opt/

RUN /opt/flatc --ts --no-fb-import -o /opt/weasel_generated.ts /opt/weasel.fbs

# ---- platform documentation ----

FROM node:15-alpine as doc_platform_builder

RUN apk add --no-cache g++ make python

COPY Readme.md /opt/Readme.md
COPY backend /opt/backend
COPY --from=flatc /opt/weasel_generated.ts /opt/backend/src/utils/

RUN yarn --cwd /opt/backend install \
  && yarn cache clean \
  && yarn --cwd /opt/backend doc

# ---- client-cpp documentation ----

FROM alpine:3.12 as doc_client_cpp_builder

RUN apk add --update --no-cache bash doxygen cmd:pip3 \
  && pip3 install --no-cache-dir --upgrade pip \
  && pip3 install --upgrade --no-cache-dir breathe m2r2 sphinx sphinx-rtd-theme \
  && rm -rf /var/lib/apt/lists/*

COPY clients/cpp /opt/clients/cpp
COPY config/flatbuffers /opt/config/flatbuffers

RUN cd /opt/clients/cpp && bash build.sh --docs

# ---- slides documentation ----

FROM ubuntu:focal as doc_talks_builder

RUN apt-get -qq update \
  && DEBIAN_FRONTEND=noninteractive apt-get -qq install -y --no-install-recommends \
    texlive-latex-base texlive-latex-extra texlive-latex-recommended \
  && rm -rf /var/lib/apt/lists/*

COPY docs /opt/docs

RUN mkdir -p /opt/docs/local/talks \
  && mkdir -p /tmp/v1.0 \
  && cd /opt/docs/talks/v1.0 \
  && pdflatex -output-directory /tmp/v1.0 main.tex > /dev/null \
  && pdflatex -output-directory /tmp/v1.0 main.tex > /dev/null \
  && cd / \
  && mv /tmp/v1.0/main.pdf /opt/docs/local/talks/v1.0.pdf \
  && mkdir -p /tmp/v1.1 \
  && cd /opt/docs/talks/v1.1 \
  && pdflatex -output-directory /tmp/v1.1 main.tex > /dev/null \
  && pdflatex -output-directory /tmp/v1.1 main.tex > /dev/null \
  && cd / \
  && mv /tmp/v1.1/main.pdf /opt/docs/local/talks/v1.1.pdf \
  && mkdir -p /tmp/v1.2 \
  && cd /opt/docs/talks/v1.2 \
  && pdflatex -output-directory /tmp/v1.2 main.tex > /dev/null \
  && pdflatex -output-directory /tmp/v1.2 main.tex > /dev/null \
  && cd /

# ---- production ----

FROM nginx:1.18-alpine

LABEL maintainer="hello@getweasel.com"
LABEL org.opencontainers.image.title="weasel-webapp"
LABEL org.opencontainers.image.description="Weasel Server Web Application"
LABEL org.opencontainers.image.url="https://getweasel.com/"
LABEL org.opencontainers.image.documentation="https://docs.getweasel.com"
LABEL org.opencontainers.image.vendor="Weasel, Inc."
LABEL org.opencontainers.image.authors="hello@getweasel.com"

COPY --from=website_builder         /opt/web/out                      /www/data/web
COPY --from=webapp_builder          /opt/frontend/dist                /www/data/app
COPY --from=doc_api_builder         /opt/backend/local/docs/backend   /www/data/docs/backend
COPY --from=doc_platform_builder    /opt/backend/local/docs/platform  /www/data/docs/platform
COPY --from=doc_client_cpp_builder  /opt/clients/cpp/local/docs/html  /www/data/docs/clients/cpp
COPY --from=doc_talks_builder       /opt/docs/local/talks             /www/data/docs/talks
COPY                                frontend/nginx.conf               /etc/nginx/conf.d/default.conf
