# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import bson
import pymongo
from loguru import logger
from utilities import User

TOUCA_MONGO_URL = "mongodb://toucauser:toucapass@localhost:27017/"


class MongoClient:
    def __init__(self):
        self.client = pymongo.MongoClient(TOUCA_MONGO_URL).get_database("touca")

    def count_docs(self) -> dict:
        counter = {}
        for name in self.client.list_collection_names():
            col = self.client.get_collection(name)
            counter[name] = col.count_documents({})
        return counter

    def is_empty(self):
        """
        check if database has any document in its collections
        """
        return sum(self.count_docs().values()) == 0

    def clear_collections(self, collections=None) -> None:
        """
        remove all documents from database collections
        """
        for col_name in self.client.list_collection_names():
            if isinstance(collections, list) and col_name not in collections:
                continue
            if col_name == "users":
                self.client.get_collection(col_name).delete_many(
                    {"platformRole": {"$ne": "super"}}
                )
                continue
            self.client.get_collection(col_name).delete_many({})
            self.client.drop_collection(col_name)
            logger.debug("removed collection {}", col_name)

    def list_results(self):
        col_messages = self.client.get_collection("messages")
        query = col_messages.find(
            {"processedAt": {"$exists": True}, "contentId": {"$exists": True}},
            {"_id": 1, "batchId": 1, "contentId": 1},
        )
        for result in query:
            yield {
                "batch_id": str(result.get("batchId")),
                "content_id": str(result.get("contentId")),
                "message_id": str(result.get("_id")),
            }

    def remove_result(self, message_id):
        col_messages = self.client.get_collection("messages")
        col_messages.delete_one({"_id": bson.ObjectId(message_id)})
        logger.debug("removed message {} from mongo", message_id)
        col_comparisons = self.client.get_collection("comparisons")
        col_comparisons.delete_many(
            {
                "processedAt": {"$exists": True},
                "content_id": {"$exists": True},
                "$or": [
                    {"srcMessageId": bson.ObjectId(message_id)},
                    {"dstMessageId": bson.ObjectId(message_id)},
                ],
            }
        )
        logger.debug("removed comparisons for message {} from mongo", message_id)

    def get_user_activation_key(self, user: User) -> str:
        result = self.client.get_collection("users").find_one(
            {"email": user.email, "activationKey": {"$exists": True}},
            {"_id": 0, "activationKey": 1},
        )
        return result.get("activationKey")

    def get_account_reset_key(self, user: User) -> str:
        result = self.client.get_collection("users").find_one(
            {"email": user.email}, {"_id": 0, "resetKey": 1}
        )
        return result.get("resetKey")

    def install_server(self, user: User) -> None:
        self.client.get_collection('meta').insert_one({
            "contact": {
                "company": "Touca, Inc.",
                "email": user.email,
                "name": user.fullname
            },
            "telemetry": False
        })
