#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import json
import os
import pytest
from dataclasses import dataclass
from touca._client import Client
from touca._utils import scoped_timer
from tempfile import TemporaryDirectory
import time


@dataclass
class DateOfBirth:
    year: int
    month: int
    day: int


def write_json_and_read_back(client: Client):
    with TemporaryDirectory() as dirname:
        filepath_json = os.path.join(dirname, "output.json")
        client.save_json(filepath_json, [])
        assert os.path.exists(filepath_json)
        with open(filepath_json, "rt") as file_json:
            content = file_json.read()
            return json.loads(content)


def write_json_and_read_back_result(client: Client, key: str):
    content = write_json_and_read_back(client)
    assert len(content) == 1
    data = content[0].get("results")
    return next((x for x in data if x.get("key") == key), None)


@pytest.fixture
def loaded_client() -> Client:
    courses = ["math", "english"]
    client = Client()
    client.configure(team="some-team", suite="some-suite", version="some-version")
    client.declare_testcase("some-case")
    client.add_assertion("username", "potter")
    client.add_result("is_famous", True)
    client.add_result("tall", 6.1)
    client.add_result("age", 21)
    client.add_result("name", "harry")
    client.add_result("dob", DateOfBirth(2000, 1, 1))
    client.add_result("courses", courses)
    for course in courses:
        client.add_array_element("course-names", course)
        client.add_hit_count("course-count")
    client.add_metric("exam_time", 42)
    client.start_timer("small_time")
    time.sleep(0.01)
    client.stop_timer("small_time")
    with scoped_timer("scoped_timer"):
        time.sleep(0.01)
    return client


def test_client_loaded_json(loaded_client):
    content_json = write_json_and_read_back(loaded_client)
    assert len(content_json) == 1
    for key in ["metadata", "assertions", "results", "metrics"]:
        assert key in content_json[0]


def test_client_loaded_binary(loaded_client):
    with TemporaryDirectory() as dirname:
        file_binary = os.path.join(dirname, "output.bin")
        loaded_client.save_binary(file_binary, [])
        assert os.path.exists(file_binary)


def test_client_loaded_object_default_serialize():
    client = Client()
    client.configure()
    client.declare_testcase("some-case")
    client.add_result("dob", DateOfBirth(2000, 1, 1))
    result = write_json_and_read_back_result(client, "dob")
    assert result.get("value") == '{"year": 2000, "month": 1, "day": 1}'


def test_client_loaded_object_custom_serialize():
    serializer = lambda x: {"y": x.year, "m": x.month, "d": x.day}
    client = Client()
    client.configure()
    client.declare_testcase("some-case")
    client.add_serializer(DateOfBirth, serializer)
    client.add_result("dob", DateOfBirth(2000, 1, 1))
    result = write_json_and_read_back_result(client, "dob")
    assert result.get("value") == '{"y": 2000, "m": 1, "d": 1}'
