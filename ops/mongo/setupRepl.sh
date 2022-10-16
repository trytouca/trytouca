#!/bin/bash

echo "**********************************************"
echo "Waiting for database startup.."
sleep 10
echo "initializing single member replica set"

echo SETUP.sh time now: `date +"%T" `
mongosh --host touca_mongo --port 27017 --username ${MONGO_INITDB_ROOT_USERNAME} --password ${MONGO_INITDB_ROOT_PASSWORD} <<EOF
conf = {
    "_id": "touca_mongo_repl",
    "version": 1,
    "members": [
        {
            "_id": 0,
            "host": "localhost"
        }
    ]
}
rs.initiate(conf)
rs.status()
EOF