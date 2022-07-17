#!/usr/bin/env bash

/opt/touca/cmp/local/dist/bin/touca_cmp -c /opt/touca/cmp/config/config.json &
/usr/local/bin/node /opt/touca/api/dist/server.js &
/usr/sbin/nginx -g 'daemon off;' &
wait -n
exit $?
