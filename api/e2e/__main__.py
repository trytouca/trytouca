# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import sys
import logging
from rich.logging import RichHandler
from minio import Minio
from minio.deleteobjects import DeleteObject
from playbook import Playbook
from client_api import ApiClient
from client_mongo import MongoClient
from utilities import config, build_path

logger = logging.getLogger("touca.api.e2e")


class MinioClient:
    def __init__(self):
        self.client = Minio(
            endpoint=f'{config.get("MINIO_HOST")}:{config.get("MINIO_PORT")}',
            access_key=config.get("MINIO_USER"),
            secret_key=config.get("MINIO_PASS"),
            secure=False,
        )

    def remove_objects(self, bucket_name: str, list_objects):
        delete_object_list = map(lambda x: DeleteObject(x.object_name), list_objects)
        errors = self.client.remove_objects(bucket_name, delete_object_list)
        for error in errors:
            print("error when deleting object", error)

    def clear_buckets(self) -> None:
        logger.info("clearing bucket touca")
        for name in ["artifacts", "comparisons", "messages", "results"]:
            self.remove_objects(
                "touca", self.client.list_objects("touca", f"{name}/", True)
            )
            old_bucket = f"touca-{name}"
            if self.client.bucket_exists(old_bucket):
                logger.info(f"clearing bucket {old_bucket.name}")
                self.remove_objects(
                    old_bucket.name, self.client.list_objects(old_bucket.name)
                )


def setup_databases():
    """
    Resets databases and test result directories.
    """
    logger.debug("setting up databases")
    minio_client = MinioClient()
    mongo_client = MongoClient()
    for result in mongo_client.list_results():
        mongo_client.remove_result(result.get("message_id"))
    minio_client.clear_buckets()
    mongo_client.clear_collections()
    logger.info("setup databases")


def main():
    """
    Integration Test for the Touca Server API service. This test
    requires the server api, minio, mongo, and redis to be running.
    """
    logging.basicConfig(
        format="%(message)s",
        handlers=[RichHandler(show_path=False, show_time=False)],
        level=logging.INFO,
    )
    api_client = ApiClient()
    if not api_client.is_up():
        logger.error("platform is not ready for this test")
        sys.exit(1)
    setup_databases()
    for action in Playbook.reader(build_path(config.get("TOUCA_PLAYBOOK_FILE"))):
        action()


if __name__ == "__main__":
    main()
