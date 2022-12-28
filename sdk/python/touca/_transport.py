# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import json

import certifi
from urllib3.poolmanager import PoolManager
from urllib3.response import HTTPResponse

__version__ = "1.8.2"


class Transport:
    def __init__(self):
        self._token = None
        self._pool = PoolManager(cert_reqs="CERT_REQUIRED", ca_certs=certifi.where())

    def authenticate(self, api_url: str, api_key: str):
        from touca._options import ToucaError

        if self._token and self._api_key == api_key and self._api_url == api_url:
            return
        self._api_key = api_key
        self._api_url = api_url
        response = self.request(
            method="POST",
            path="/client/signin",
            body={"key": api_key},
        )
        if response.status == 401:
            raise ToucaError("auth_invalid_key")
        if response.status != 200:
            raise ToucaError("auth_invalid_response", response.status)
        body = json.loads(response.data.decode("utf-8"))
        self._token = body["token"]

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
        if self._token:
            headers.update({"Authorization": f"Bearer {self._token}"})
        return self._pool.request(
            method=method,
            url=f"{self._api_url}{path}",
            body=body,
            headers=headers,
        )
