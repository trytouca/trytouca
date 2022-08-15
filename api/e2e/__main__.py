# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import sys
from dataclasses import dataclass
from loguru import logger
from minio import Minio
from playbook import Playbook
from client_api import ApiClient
from client_mongo import MongoClient
from utilities import config, build_path


class MinioClient:
    def __init__(self):
        self.client = Minio(
            endpoint=f'{config.get("MINIO_HOST")}:{config.get("MINIO_PORT")}',
            access_key=config.get("MINIO_USER"),
            secret_key=config.get("MINIO_PASS"),
            secure=False,
        )

    def count_docs(self) -> int:
        return sum(
            [
                len(list(self.client.list_objects(x.name)))
                for x in self.client.list_buckets()
            ]
        )

    def clear_buckets(self) -> None:
        for bucket in self.client.list_buckets():
            docs = list(self.client.list_objects(bucket.name))
            for doc in docs:
                self.client.remove_object(bucket.name, doc.object_name)


@dataclass
class DatabaseCounters:
    minio_client: MinioClient
    mongo_client: MongoClient

    def get_counters(self):
        databases = [self.minio_client, self.mongo_client]
        return list(map(lambda x: x.count_docs(), databases))

    def log_counters(self, msg: str) -> None:
        logger.debug("{}: {}", msg, self.get_counters())


def setup_databases():
    """
    Resets databases and test result directories.
    """
    minio_client = MinioClient()
    mongo_client = MongoClient()
    counters = DatabaseCounters(minio_client, mongo_client)
    counters.log_counters("before database cleanup")
    for result in mongo_client.list_results():
        mongo_client.remove_result(result.get("message_id"))
    counters.log_counters("after database cleanup")
    minio_client.clear_buckets()
    mongo_client.clear_collections()
    counters.log_counters("after database hard reset")
    logger.success("setup databases")


def main():
    """
    Integration Test for the Touca Server API service. This test requires a
    running platform server, minio, mongo, and redis databases.
    """

    # configure logger

    logger.remove()
    logger.add(
        sys.stdout,
        level="INFO",
        colorize=True,
        format="<green>{time:HH:mm:ss!UTC}</green> | <cyan>{level: <7}</cyan> | <lvl>{message}</lvl>",
    )
    logger.add(
        build_path("logs/touca_{time:YYMMDD!UTC}.log"),
        level="DEBUG",
        rotation="1 day",
        compression="zip",
    )

    # check that the platform is properly configured

    api_client = ApiClient()
    if not api_client.is_up():
        logger.error("platform is not ready for this test")
        sys.exit(1)

    setup_databases()

    for action in Playbook.reader(build_path(config.get("TOUCA_PLAYBOOK_FILE"))):
        action()


if __name__ == "__main__":
    main()
