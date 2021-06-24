#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import json
import os
from touca._client import Client
from tempfile import TemporaryDirectory


def test_empty_client():
    client = Client()
    assert not client.is_configured()
    assert not client.configuration_error()
    client.configure()
    assert client.is_configured()
    assert not client.configuration_error()
    assert not client.save("some_file")


def test_configure_by_file_empty():
    with TemporaryDirectory() as tmpdirname:
        filepath = os.path.join(tmpdirname, "some_file")
        with open(filepath, "wt") as file:
            file.write(json.dumps({"touca": {}}))
        client = Client()
        assert client.configure(file=filepath)
        assert not client.configuration_error()


def test_configure_by_file_full():
    os.environ["TOUCA_API_KEY"] = "sample_touca_key"
    os.environ["TOUCA_TEST_VERSION"] = "v1.0"
    with TemporaryDirectory() as tmpdirname:
        filepath = os.path.join(tmpdirname, "some_file")
        with open(filepath, "wt") as file:
            file.write(
                json.dumps(
                    {
                        "touca": {
                            "api_key": "to be overwritten",
                            "api_url": "https://api.touca.io/v1/@/acme/students",
                            "handshake": False,
                        }
                    }
                )
            )
        client = Client()
        assert client.configure(file=filepath)
        assert not client.configuration_error()
        for key, value in dict(
            {
                "api_url": "https://api.touca.io/v1",
                "api_key": "sample_touca_key",
                "handshake": False,
                "team": "acme",
                "suite": "students",
                "version": "v1.0",
                "concurrency": True,
            }
        ).items():
            assert client._options[key] == value
