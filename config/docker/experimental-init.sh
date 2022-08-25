#!/usr/bin/env bash

/usr/local/bin/node /opt/touca/api/dist/server.js &
/usr/sbin/nginx -g 'daemon off;' &
wait -n
exit $?
