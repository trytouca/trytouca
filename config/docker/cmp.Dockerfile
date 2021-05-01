FROM ubuntu:focal

LABEL maintainer="hello@getweasel.com"
LABEL org.opencontainers.image.title="weasel-cmp"
LABEL org.opencontainers.image.description="Weasel Server Comparator"
LABEL org.opencontainers.image.url="https://getweasel.com/"
LABEL org.opencontainers.image.documentation="https://docs.getweasel.com"
LABEL org.opencontainers.image.vendor="Weasel, Inc."
LABEL org.opencontainers.image.authors="hello@getweasel.com"

COPY cmp/local/dist /usr/local
COPY cmp/config/config.prod.json /usr/local/etc/config.json

CMD [ "/usr/local/bin/weasel_cmp", "--config-file=/usr/local/etc/config.json" ]
