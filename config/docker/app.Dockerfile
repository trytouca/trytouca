FROM nginx:1.18-alpine

LABEL maintainer="hello@touca.io"
LABEL org.opencontainers.image.title="touca-app"
LABEL org.opencontainers.image.description="Touca Web Application"
LABEL org.opencontainers.image.url="https://app.touca.io/"
LABEL org.opencontainers.image.documentation="https://touca.io/docs"
LABEL org.opencontainers.image.vendor="Touca, Inc."
LABEL org.opencontainers.image.authors="hello@touca.io"

COPY app/dist                                   /www/data/app
COPY app/nginx.conf                             /etc/nginx/conf.d/default.conf
