# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import json
from typing import Dict, Tuple

import certifi
from urllib3.exceptions import MaxRetryError
from urllib3.poolmanager import PoolManager
from urllib3.response import HTTPResponse

__version__ = "1.8.7"


class AuthClient:
    def __init__(self, options):
        self._api_url = options.get("api_url")
        self._api_key = options.get("api_key")
        self._team = options.get("team")
        self._pool = PoolManager(cert_reqs="CERT_REQUIRED", ca_certs=certifi.where())

    def _request(
        self,
        method,
        path,
        body=None,
    ) -> HTTPResponse:
        from touca._options import ToucaError

        headers = {
            "Accept-Charset": "utf-8",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": f"touca-client-python/{__version__}",
        }
        if self._api_key:
            headers["X-Touca-API-Key"] = self._api_key
        body = json.dumps(body).encode("utf-8")
        try:
            return self._pool.request(
                method=method,
                url=f"{self._api_url}{path}",
                headers=headers,
                body=body,
            )
        except MaxRetryError:
            raise ToucaError("auth_server_down")

    def verify_api_key(self) -> bool:
        if not self._api_key:
            return False
        response = self._request(
            method="POST",
            path="/client/verify",
            body={"team": self._team},
        )
        return response.status == 204

    def create_auth_token(self) -> Tuple[str, str]:
        response = self._request(
            method="POST",
            path="/client/auth",
            body=None,
        )
        body = json.loads(response.data.decode("utf-8"))
        return body.get("token"), body.get("url")

    def auth_token_status(self, token: str) -> Tuple[str, str | None]:
        response = self._request(
            method="GET",
            path=f"/client/auth/{token}",
            body=None,
        )
        body = json.loads(response.data.decode("utf-8"))
        return body.get("status"), body.get("apiKey")


class Transport:
    def __init__(self):
        self._api_key = None
        self._api_url = None
        self._pool = PoolManager(cert_reqs="CERT_REQUIRED", ca_certs=certifi.where())

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
            body = json.dumps(body).encode("utf-8")
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
