#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import json
import os
import touca
from pytest import raises
from tempfile import TemporaryDirectory


def test_empty_client():
    assert not touca.is_configured()
    assert not touca.configuration_error()
    touca.configure()
    assert touca.is_configured()
    assert not touca.configuration_error()
    for function in [touca.get_testcases, touca.seal, touca.post]:
        with raises(
            RuntimeError, match="client not configured to perform this operation"
        ):
            function()
    assert not touca.save_binary("some_file")
    assert not touca.save_json("some_file")


def test_configure_by_file_empty():
    with TemporaryDirectory() as tmpdirname:
        filepath = os.path.join(tmpdirname, "some_file")
        with open(filepath, "wt") as file:
            file.write(json.dumps({"touca": {}}))
        assert touca.configure(file=filepath)
        assert not touca.configuration_error()


def test_configure_by_file_missing():
    assert not touca.configure(file="missing_file")
    assert "file not found" in touca.configuration_error()


def test_configure_by_file_plaintext():
    with TemporaryDirectory() as tmpdirname:
        filepath = os.path.join(tmpdirname, "some_file")
        with open(filepath, "wt") as file:
            file.write("touca")
        assert not touca.configure(file=filepath)
        assert "file has unexpected format" in touca.configuration_error()


def test_configure_by_file_invalid():
    with TemporaryDirectory() as tmpdirname:
        filepath = os.path.join(tmpdirname, "some_file")
        with open(filepath, "wt") as file:
            file.write(json.dumps({"field": {}}))
        assert not touca.configure(file=filepath)
        assert "file is missing JSON field" in touca.configuration_error()


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
        client = touca.Client()
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
