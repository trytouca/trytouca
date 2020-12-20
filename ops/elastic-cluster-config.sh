#!/bin/bash

curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "transient": {
    "cluster.routing.allocation.disk.watermark.low": "2gb",
    "cluster.routing.allocation.disk.watermark.high": "1gb",
    "cluster.routing.allocation.disk.watermark.flood_stage": "500mb",
    "cluster.info.update.interval": "1m"
  }
}
'
