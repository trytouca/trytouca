#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from dataclasses import dataclass
import pytest
from touca._case import Case
from touca._types import TypeHandler
import time


def test_case_empty_metadata():
    case = Case()
    json = case.json()
    assert "metadata" in json
    meta = json.get("metadata")
    assert isinstance(meta, dict)
    for field in ["teamslug", "testsuite", "version", "testcase"]:
        assert field in meta
        assert meta.get(field) == "unknown"


def test_case_empty_data():
    case = Case()
    json = case.json()
    for field in ["assertions", "results", "metrics"]:
        assert field in json
        assert isinstance(json.get(field), list)
        assert json.get(field) == []


def test_case_empty_binary():
    case = Case()
    binary = case.serialize()
    assert binary


@dataclass
class DateOfBirth:
    year: int
    month: int
    day: int


@pytest.fixture
def loaded_case() -> Case:
    from datetime import date

    type_handler = TypeHandler()
    case = Case(
        team="some-team", suite="some-suite", version="some-version", name="some-case"
    )
    case.assume("username", type_handler.transform("potter"))
    case.check("name", type_handler.transform("harry"))
    case.check("dob", type_handler.transform(DateOfBirth(2000, 1, 1)))
    case.check("enroll_date", type_handler.transform(date(2018, 3, 1)))
    for course in ["math", "english"]:
        case.add_array_element("course-names", type_handler.transform(course))
        case.add_hit_count("course-count")

    case.add_metric("exam_time", 42)
    case.start_timer("small_time")
    time.sleep(0.01)
    case.stop_timer("small_time")

    return case


def test_case_loaded_metadata(loaded_case):
    json = loaded_case.json()
    assert "metadata" in json
    meta = json.get("metadata")
    assert isinstance(meta, dict)
    for field, expected in {
        "teamslug": "some-team",
        "testsuite": "some-suite",
        "version": "some-version",
        "testcase": "some-case",
    }.items():
        assert field in meta
        assert meta.get(field) == expected


def test_case_loaded_assertions(loaded_case):
    json = loaded_case.json()
    data = json.get("assertions")
    assert len(data) == 1
    assert data[0].get("key") == "username"
    assert data[0].get("value") == "potter"


def test_case_loaded_result_object(loaded_case):
    json = loaded_case.json()
    data = json.get("results")
    item = next((x for x in data if x.get("key") == "dob"), None)
    assert item is not None
    assert item.get("value") == '{"year": 2000, "month": 1, "day": 1}'
    item2 = next((x for x in data if x.get("key") == "enroll_date"), None)
    assert item2 is not None
    assert item2.get("value") == '{"year": 2018, "month": 3, "day": 1}'


def test_case_loaded_serialize(loaded_case):
    assert loaded_case.serialize()
