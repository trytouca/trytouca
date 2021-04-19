FROM nginx:1.18-alpine

LABEL maintainer="hello@getweasel.com"
LABEL org.opencontainers.image.title="weasel-app"
LABEL org.opencontainers.image.description="Weasel Web Application"
LABEL org.opencontainers.image.url="https://app.getweasel.com/"
LABEL org.opencontainers.image.documentation="https://docs.getweasel.com"
LABEL org.opencontainers.image.vendor="Weasel, Inc."
LABEL org.opencontainers.image.authors="hello@getweasel.com"

COPY web/out                        /www/data/web
COPY frontend/dist                  /www/data/app
COPY backend/local/docs/external    /www/data/docs/backend
COPY clients/cpp/local/docs/html    /www/data/docs/clients/cpp
COPY frontend/nginx.conf            /etc/nginx/conf.d/default.conf
