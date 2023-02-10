# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from json import dumps
from typing import Dict

from certifi import where
from urllib3.exceptions import MaxRetryError
from urllib3.poolmanager import PoolManager
from urllib3.response import HTTPResponse

__version__ = "1.8.7"


class Transport:
    def __init__(self):
        self._api_key = None
        self._api_url = None
        self._pool = PoolManager(cert_reqs="CERT_REQUIRED", ca_certs=where())

    def configure(self, options: dict):
        from touca._options import ToucaError

        if self._api_key == options.get("api_key") and self._api_url == options.get(
            "api_url"
        ):
            return
        self._api_key = options.get("api_key")
        self._api_url = options.get("api_url")
        response = self.request(
            method="POST", path="/client/verify", body={"team": options.get("team")}
        )
        if response.status == 401:
            raise ToucaError("auth_invalid_key")
        if response.status != 204:
            raise ToucaError("auth_invalid_response", response.status)

    def request(
        self,
        method,
        path,
        body=None,
        content_type="application/json",
        extra_headers: Dict[str, str] = {},
    ) -> HTTPResponse:
        from touca._options import ToucaError

        if body and content_type == "application/json":
            body = dumps(body).encode("utf-8")
        headers = {
            "Accept-Charset": "utf-8",
            "Accept": "application/json",
            "Content-Type": content_type,
            "User-Agent": f"touca-client-python/{__version__}",
        }
        headers.update(extra_headers)
        if self._api_key:
            headers["X-Touca-API-Key"] = self._api_key
        try:
            return self._pool.request(
                method=method,
                url=f"{self._api_url}{path}",
                body=body,
                headers=headers,
            )
        except MaxRetryError:
            raise ToucaError("auth_server_down")
