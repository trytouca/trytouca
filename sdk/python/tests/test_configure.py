# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import json
import os
from tempfile import TemporaryDirectory

import pytest
import touca
from touca._options import ToucaError


def test_empty_client():
    assert not touca.is_configured()
    assert not touca.configuration_error()
    touca.configure()
    assert touca.is_configured()
    assert not touca.configuration_error()
    for function in [touca.seal, touca.post]:
        with pytest.raises(
            ToucaError, match="Client not configured to perform this operation."
        ):
            function()
    with TemporaryDirectory() as tmpdirname:
        tmpfile = os.path.join(tmpdirname, "some_file")
        touca.save_binary(tmpfile)
        touca.save_json(tmpfile)


def test_configure_by_file_empty():
    with TemporaryDirectory() as tmpdirname:
        filepath = os.path.join(tmpdirname, "some_file")
        with open(filepath, "wt") as file:
            file.write(json.dumps({"touca": {}}))
        assert touca.configure(config_file=filepath)
        assert not touca.configuration_error()


def test_configure_by_file_missing():
    assert not touca.configure(config_file="missing_file")
    assert "file does not exist" in touca.configuration_error()


def test_configure_by_file_plaintext():
    with TemporaryDirectory() as tmpdirname:
        filepath = os.path.join(tmpdirname, "some_file")
        with open(filepath, "wt") as file:
            file.write("touca")
        assert not touca.configure(config_file=filepath)
        assert "file has an unexpected format" in touca.configuration_error()


def test_configure_by_file_invalid():
    with TemporaryDirectory() as tmpdirname:
        filepath = os.path.join(tmpdirname, "some_file")
        with open(filepath, "wt") as file:
            file.write(json.dumps({"field": {}}))
        assert not touca.configure(config_file=filepath)
        assert "file has an unexpected format" in touca.configuration_error()


def test_configure_by_file_full(monkeypatch):
    monkeypatch.setenv("TOUCA_API_KEY", "sample_touca_key")
    monkeypatch.setenv("TOUCA_TEST_VERSION", "v1.0")
    with TemporaryDirectory() as tmpdirname:
        filepath = os.path.join(tmpdirname, "some_file")
        with open(filepath, "wt") as file:
            file.write(
                json.dumps(
                    {
                        "touca": {
                            "api-key": "to be overwritten",
                            "api-url": "https://api.touca.io/v1/@/acme/students",
                            "offline": True,
                        }
                    }
                )
            )
        client = touca.Client()
        assert client.configure(config_file=filepath)
        assert not client.configuration_error()
        for key, value in dict(
            {
                "api_url": "https://api.touca.io/v1",
                "api_key": "sample_touca_key",
                "offline": True,
                "team": "acme",
                "suite": "students",
                "version": "v1.0",
                "concurrency": True,
            }
        ).items():
            assert client._options[key] == value
