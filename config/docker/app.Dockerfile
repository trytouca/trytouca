FROM nginx:1.18-alpine

LABEL maintainer="hello@touca.io"
LABEL org.opencontainers.image.title="touca-app"
LABEL org.opencontainers.image.description="Touca Web Application"
LABEL org.opencontainers.image.url="https://app.touca.io/"
LABEL org.opencontainers.image.documentation="https://docs.touca.io"
LABEL org.opencontainers.image.vendor="Touca, Inc."
LABEL org.opencontainers.image.authors="hello@touca.io"

COPY api/local/docs/external        /www/data/docs/api
COPY app/dist                       /www/data/app
COPY app/nginx.conf                 /etc/nginx/conf.d/default.conf
COPY clients/cpp/local/docs/html    /www/data/docs/clients/cpp
COPY clients/python/local/docs      /www/data/docs/clients/python
COPY web/out                        /www/data/web
