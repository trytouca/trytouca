FROM ubuntu:focal

LABEL maintainer="hello@touca.io"
LABEL org.opencontainers.image.title="touca-cmp"
LABEL org.opencontainers.image.description="Touca Comparator"
LABEL org.opencontainers.image.url="https://touca.io/"
LABEL org.opencontainers.image.documentation="https://touca.io/docs"
LABEL org.opencontainers.image.vendor="Touca, Inc."
LABEL org.opencontainers.image.authors="hello@touca.io"

COPY cmp/local/dist                 /usr/local
COPY cmp/config/config.prod.json    /usr/local/etc/config.json

CMD [ "/usr/local/bin/touca_cmp", "--config-file=/usr/local/etc/config.json" ]
