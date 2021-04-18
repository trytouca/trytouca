FROM node:15-alpine

LABEL maintainer="hello@getweasel.com"
LABEL org.opencontainers.image.title="weasel-api"
LABEL org.opencontainers.image.description="Weasel API"
LABEL org.opencontainers.image.url="https://api.getweasel.com/"
LABEL org.opencontainers.image.documentation="https://docs.getweasel.com"
LABEL org.opencontainers.image.vendor="Weasel, Inc."
LABEL org.opencontainers.image.authors="hello@getweasel.com"

EXPOSE 8081

COPY backend/dist           /opt/weasel/dist
COPY backend/env            /opt/weasel/env
COPY backend/samples        /opt/weasel/samples
COPY backend/node_modules   /opt/weasel/node_modules

CMD ["node", "/opt/weasel/dist/server.js"]
