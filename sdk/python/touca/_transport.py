# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import json

import certifi
from urllib3.poolmanager import PoolManager
from urllib3.response import HTTPResponse

__version__ = "1.8.4"


class Transport:
    def __init__(self):
        self._pool = PoolManager(cert_reqs="CERT_REQUIRED", ca_certs=certifi.where())

    def configure(self, api_url: str, api_key: str):
        self._api_url = api_url
        self._api_key = api_key

    def request(
        self, method, path, body=None, content_type="application/json"
    ) -> HTTPResponse:
        if body and content_type == "application/json":
            body = json.dumps(body).encode("utf-8")
        headers = {
            "Accept-Charset": "utf-8",
            "Accept": "application/json",
            "Content-Type": content_type,
            "User-Agent": f"touca-client-python/{__version__}",
        }
        if self._api_key:
            headers["X-Touca-API-Key"] = self._api_key
        return self._pool.request(
            method=method,
            url=f"{self._api_url}{path}",
            body=body,
            headers=headers,
        )
