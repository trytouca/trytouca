#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

#!/usr/bin/env python

import os
import sys
from dataclasses import dataclass
import elasticsearch
from loguru import logger

from playbook import Playbook
from client_api import WeaselApiClient
from client_mongo import WeaselMongoClient
from utilities import pathify

WEASEL_ELASTIC_URL="http://localhost:9200/"
WEASEL_USERS_FILE=pathify("users.txt")
WEASEL_PLAYBOOK_FILE=pathify("playbook.csv")

class WeaselElasticClient:
    def __init__(self):
        self.client = elasticsearch.Elasticsearch(hosts=[WEASEL_ELASTIC_URL])

    def count_docs(self) -> int:
        aliases = list(self.client.indices.get_alias().keys())
        indices = [ _ for _ in ['results', 'comparisons'] if _ in aliases]
        counter = {}
        for index in indices:
            self.client.indices.refresh(index)
            response = self.client.cat.count(index, params={"format": "json"})
            counter[index] = int(response[0].get('count'))
        return counter

    def remove_result(self, elastic_id: str) -> None:
        self.client.delete('results', elastic_id)
        logger.debug("removed message {} from elastic", elastic_id)

    def clear_indices(self) -> None:
        for index in [ 'results', 'comparisons' ]:
            self.client.delete_by_query(index=index, body={ 'query': { 'match_all': {} } })

class WeaselDataStore:
    def __init__(self):
        self.dir_root = os.path.abspath(os.path.join(os.path.dirname(__file__),
            os.pardir, os.pardir, 'local', 'data', 'weasel'))
        logger.debug("path to weasel data store: {}", self.dir_root)

    def count_docs(self) -> dict:
        counter = {}
        for batch_id in os.listdir(self.dir_root):
            counter[batch_id] = len(os.listdir(os.path.join(self.dir_root, batch_id)))
        return counter

    def remove_result(self, batch_id, message_id):
        filepath = os.path.join(self.dir_root, batch_id, message_id)
        if os.path.exists(filepath):
            os.remove(filepath)
            logger.debug("removed message {} from datastore", message_id)
        dir_batch = os.path.join(self.dir_root, batch_id)
        if len(os.listdir(dir_batch)) == 0:
            os.rmdir(dir_batch)
            logger.debug("removed batch {} from datastore", batch_id)

    def remove_leftovers(self) -> None:
        for batch_id in os.listdir(self.dir_root):
            os.rmdir(os.path.join(self.dir_root, batch_id))
            logger.debug("removed leftover batch {} from datastore", batch_id)

@dataclass
class DatabaseCounters:
    data_store: WeaselDataStore
    elastic_client: WeaselElasticClient
    mongo_client: WeaselMongoClient

    def get_counters(self):
        databases = [ self.data_store, self.elastic_client, self.mongo_client ]
        return list(map(lambda x: x.count_docs(), databases))

    def log_counters(self, msg: str) -> None:
        logger.debug("{}: {}", msg, self.get_counters())

def setup_databases():
    """
    Resets databases and test result directories.
    """

    data_store = WeaselDataStore()
    elastic_client = WeaselElasticClient()
    mongo_client = WeaselMongoClient()
    counters = DatabaseCounters(data_store, elastic_client, mongo_client)
    counters.log_counters("before database cleanup")

    for result in mongo_client.list_results():
        elastic_client.remove_result(result.get('elastic_id'))
        mongo_client.remove_result(result.get('message_id'))
        data_store.remove_result(result.get('batch_id'), result.get('message_id'))
    counters.log_counters("after database cleanup")

    mongo_client.clear_collections()
    if sum(elastic_client.count_docs().values()) != 0:
        elastic_client.clear_indices()
    data_store.remove_leftovers()
    counters.log_counters("after database hard reset")

    logger.success("setup databases")

@logger.catch
def test_main():
    """
    Integration Test for Weasel Platform API. This test requires a running
    platform server, mongo, elastic and redis databases.
    """

    # configure logger

    logger.remove()
    logger.add(sys.stdout, level="INFO", colorize=True, \
        format="<green>{time:HH:mm:ss!UTC}</green> | <cyan>{level: <7}</cyan> | <lvl>{message}</lvl>")
    logger.add("logs/weasel_{time:YYMMDD!UTC}.log", level="DEBUG", rotation="1 day", compression="zip")

    # check that the platform is properly configured

    api_client = WeaselApiClient()
    if not api_client.is_up():
        logger.error('platform is not ready for this test')
        return

    setup_databases()

    for action in Playbook.reader(WEASEL_PLAYBOOK_FILE):
        action()

if __name__ == '__main__':
    test_main()
