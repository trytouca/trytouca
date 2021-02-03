# ---- frontend (development version) ----

FROM node:15-alpine as frontend_builder

RUN apk add --no-cache bash

COPY frontend /opt/frontend
COPY docs /opt/docs

RUN yarn --cwd /opt/frontend install --frozen-lockfile \
  && yarn --cwd /opt/frontend cache clean \
  && yarn --cwd /opt/frontend build --prod --aot
