# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import certifi
import json
from touca.__init__ import __version__ as client_version
from typing import List
from urllib3.poolmanager import PoolManager
from urllib3.response import HTTPResponse


class Transport:
    """ """

    def __init__(self, options: dict):

        self._options = options
        self._token = None
        self._pool = PoolManager(cert_reqs="CERT_REQUIRED", ca_certs=certifi.where())
        self._handshake()

    def _handshake(self):
        response = self._send_request("GET", "/platform")
        if response.status != 200:
            raise RuntimeError("could not communicate with touca server")
        content = json.loads(response.data.decode("utf-8"))
        if not content["ready"]:
            raise RuntimeError("touca server is not ready")

    def _send_request(
        self, method, path, body=None, content_type="application/json"
    ) -> HTTPResponse:
        if body and content_type == "application/json":
            body = json.dumps(body).encode("utf-8")
        headers = {
            "Accept-Charset": "utf-8",
            "Accept": "application/json",
            "Content-Type": content_type,
            "User-Agent": f"touca-client-python/{client_version}",
        }
        if self._token:
            headers.update({"Authorization": f"Bearer {self._token}"})
        return self._pool.request(
            method=method,
            url=f"{self._options.get('api-url')}{path}",
            body=body,
            headers=headers,
        )

    def update_options(self, options: dict):
        if any(k in options for k in ["api-key", "api-url"]):
            self._token = None
            self._handshake()
        self._options.update(options)

    def authenticate(self):
        """
        :raises: ValueError if authentication fails
        """
        if self._token:
            return
        response = self._send_request(
            method="POST",
            path="/client/signin",
            body={"key": self._options.get("api-key")},
        )
        if response.status == 401:
            raise ValueError("Authentication failed: API Key Invalid")
        if response.status != 200:
            raise ValueError("Authentication failed: Invalid Response")
        body = json.loads(response.data.decode("utf-8"))
        self._token = body["token"]

    def get_testcases(self) -> List[str]:
        team = self._options.get("team")
        suite = self._options.get("suite")
        response = self._send_request(
            method="GET", path=f"/client/element/{team}/{suite}"
        )
        if response.status != 200:
            raise RuntimeError("Failed to obtain list of test cases")
        body = json.loads(response.data.decode("utf-8"))
        return [k["name"] for k in body]

    def post(self, content):
        response = self._send_request(
            method="POST",
            path=f"/client/submit",
            body=content,
            content_type="application/octet-stream",
        )
        if response.status == 204:
            return
        if response.status == 400 and "batch is sealed" in response.data.decode(
            "utf-8"
        ):
            reason = " This version is already submitted and sealed."
        raise RuntimeError(f"Failed to submit test results.{reason}")

    def seal(self):
        slugs = "/".join(self._options.get(k) for k in ["team", "suite", "version"])
        response = self._send_request(method="POST", path=f"/batch/{slugs}/seal2")
        if response.status != 204:
            raise RuntimeError("Failed to seal this version")
