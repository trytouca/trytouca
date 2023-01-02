# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from dataclasses import dataclass
from datetime import date
from pathlib import Path
from time import sleep

import pytest
from touca._case import Case
from touca._types import TypeHandler
from touca_fbs import Message, ResultType, Type, TypeCreator


@dataclass
class DateOfBirth:
    year: int
    month: int
    day: int


def test_case_metadata_empty():
    case = Case()
    json = case.json()
    assert "metadata" in json
    meta = json.get("metadata")
    assert isinstance(meta, dict)
    for field in ["teamslug", "testsuite", "version", "testcase"]:
        assert field in meta
        assert meta.get(field) == "unknown"


def test_case_metadata_json():
    case = Case(team="t", suite="s", version="v", name="n")
    meta = case.json().get("metadata")
    assert isinstance(meta, dict)
    assert meta.get("teamslug") == "t"
    assert meta.get("testsuite") == "s"
    assert meta.get("version") == "v"
    assert meta.get("testcase") == "n"


def test_case_metadata_binary():
    case = Case(team="t", suite="s", version="v", name="n")
    binary = case.serialize()
    m = Message.GetRootAs(binary, 0).Metadata()
    assert m.Teamslug() == b"t"
    assert m.Testsuite() == b"s"
    assert m.Version() == b"v"
    assert m.Testcase() == b"n"


def test_case_empty_json():
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
    m = Message.GetRootAs(binary, 0)
    assert m.Results().EntriesLength() == 0
    assert m.Metrics().EntriesLength() == 0
    assert m.Metadata().Teamslug() == b"unknown"


def test_case_check_file_json(tmp_path: Path):
    case = Case()
    tmp_file = tmp_path.joinpath("myfile.txt")
    tmp_file.write_text("Hello World")
    case.check_file("some-file", tmp_file)
    results = case.json()["results"]
    assert len(results) == 1
    assert results[0] == {"key": "some-file", "value": str(tmp_file)}


def test_case_check_file_binary(tmp_path: Path):
    case = Case()
    tmp_file = tmp_path.joinpath("myfile.txt")
    tmp_file.write_text("hello-world")
    case.check_file("some-file", tmp_file)
    binary = case.serialize()
    m = Message.GetRootAs(binary, 0)
    assert m.Results().EntriesLength() == 1
    assert m.Results().Entries(0).Key() == b"some-file"
    assert m.Results().Entries(0).Typ() == ResultType.Check
    v = m.Results().Entries(0).Value()
    assert v.ValueType() == Type.Blob
    blob = TypeCreator(v.ValueType(), v.Value())
    assert blob.digest.startswith(b"afa27b44")
    assert blob.mimetype == b"text/plain"
    assert blob.reference == str(tmp_file).encode()


def test_case_check_blob_json():
    type_handler = TypeHandler()
    case = Case(team="t", suite="s", version="v", name="n")
    case.check("some-blob", type_handler.transform(b"hello-world"))
    results = case.json()["results"]
    assert results == [{"key": "some-blob", "value": "BINARY"}]


def test_case_check_blob_binary():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-blob", type_handler.transform(b"hello-world"))
    binary = case.serialize()
    m = Message.GetRootAs(binary, 0)
    assert m.Results().EntriesLength() == 1
    assert m.Results().Entries(0).Key() == b"some-blob"
    assert m.Results().Entries(0).Typ() == ResultType.Check
    v = m.Results().Entries(0).Value()
    assert v.ValueType() == Type.Blob
    blob = TypeCreator(v.ValueType(), v.Value())
    assert blob.digest.startswith(b"afa27b44")
    assert blob.mimetype == None
    assert blob.reference == None


def test_case_check_decimal_json():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-decimal", type_handler.transform(4.2))
    results = case.json()["results"]
    assert results == [{"key": "some-decimal", "value": 4.2}]


def test_case_check_decimal_binary():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-decimal", type_handler.transform(4.2))
    binary = case.serialize()
    m = Message.GetRootAs(binary, 0)
    assert m.Results().EntriesLength() == 1
    assert m.Results().Entries(0).Key() == b"some-decimal"
    assert m.Results().Entries(0).Typ() == ResultType.Check
    v = m.Results().Entries(0).Value()
    assert v.ValueType() == Type.Double
    assert TypeCreator(v.ValueType(), v.Value()).value == 4.2


def test_case_check_bool_json():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-bool", type_handler.transform(True))

    json = case.json()
    assert json.get("results") == [{"key": "some-bool", "value": True}]


def test_case_check_bool_binary():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-bool", type_handler.transform(True))

    binary = case.serialize()
    m = Message.GetRootAs(binary, 0)
    assert m.Results().EntriesLength() == 1
    assert m.Results().Entries(0).Key() == b"some-bool"
    assert m.Results().Entries(0).Typ() == ResultType.Check
    v = m.Results().Entries(0).Value()
    assert v.ValueType() == Type.Bool
    assert TypeCreator(v.ValueType(), v.Value()).value == True


def test_case_check_string_json():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-string", type_handler.transform("hello"))

    json = case.json()
    assert json.get("results") == [{"key": "some-string", "value": "hello"}]


def test_case_check_string_binary():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-string", type_handler.transform("hello"))

    binary = case.serialize()
    m = Message.GetRootAs(binary, 0)
    assert m.Results().EntriesLength() == 1
    assert m.Results().Entries(0).Key() == b"some-string"
    assert m.Results().Entries(0).Typ() == ResultType.Check
    v = m.Results().Entries(0).Value()
    assert v.ValueType() == Type.String
    assert TypeCreator(v.ValueType(), v.Value()).value == b"hello"


def test_case_check_object_json():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-dob", type_handler.transform(DateOfBirth(2000, 1, 1)))

    json = case.json()
    assert json.get("results") == [
        {"key": "some-dob", "value": '{"year": 2000, "month": 1, "day": 1}'}
    ]


def test_case_check_object_binary():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-dob", type_handler.transform(DateOfBirth(2000, 1, 1)))

    binary = case.serialize()
    m = Message.GetRootAs(binary, 0)
    assert m.Results().EntriesLength() == 1
    assert m.Results().Entries(0).Key() == b"some-dob"
    assert m.Results().Entries(0).Typ() == ResultType.Check
    v = m.Results().Entries(0).Value()
    assert v.ValueType() == Type.Object


def test_case_check_object2_json():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-date", type_handler.transform(date(2018, 3, 1)))

    json = case.json()
    assert json.get("results") == [
        {"key": "some-date", "value": '{"year": 2018, "month": 3, "day": 1}'}
    ]


def test_case_check_object2_binary():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-date", type_handler.transform(date(2018, 3, 1)))

    binary = case.serialize()
    m = Message.GetRootAs(binary, 0)
    assert m.Results().EntriesLength() == 1
    assert m.Results().Entries(0).Key() == b"some-date"
    assert m.Results().Entries(0).Typ() == ResultType.Check
    v = m.Results().Entries(0).Value()
    assert v.ValueType() == Type.Object


def test_case_add_serializer():
    type_handler = TypeHandler()
    case = Case()
    type_handler.add_serializer(DateOfBirth, lambda x: x.year)
    case.check("some-dob", type_handler.transform(DateOfBirth(2000, 1, 1)))

    json = case.json()
    assert json.get("results") == [{"key": "some-dob", "value": 2000}]


def test_case_check_vector_json():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-numbers", type_handler.transform([42, 43, 4.2]))

    json = case.json()
    assert json.get("results") == [{"key": "some-numbers", "value": "[42, 43, 4.2]"}]


def test_case_check_vector_binary():
    type_handler = TypeHandler()
    case = Case()
    case.check("some-numbers", type_handler.transform([42, 43, 4.2]))

    binary = case.serialize()
    m = Message.GetRootAs(binary, 0)
    assert m.Results().EntriesLength() == 1
    assert m.Results().Entries(0).Key() == b"some-numbers"
    assert m.Results().Entries(0).Typ() == ResultType.Check
    v = m.Results().Entries(0).Value()
    assert v.ValueType() == Type.Array
    assert len(TypeCreator(v.ValueType(), v.Value()).values) == 3


def test_case_add_array_element_invalid():
    type_handler = TypeHandler()
    case = Case()
    case.assume("some-array", type_handler.transform([]))
    with pytest.raises(RuntimeError, match="specified key has a different type"):
        case.add_array_element("some-array", 42)
    case.check("some-non-array", type_handler.transform(42))
    with pytest.raises(RuntimeError, match="specified key has a different type"):
        case.add_array_element("some-array", 42)


def test_case_add_hit_count_invalid():
    type_handler = TypeHandler()
    case = Case()
    case.assume("some-number", type_handler.transform(1))
    with pytest.raises(RuntimeError, match="specified key has a different type"):
        case.add_hit_count("some-number")
    case.check("some-non-number", type_handler.transform("42"))
    with pytest.raises(RuntimeError, match="specified key has a different type"):
        case.add_hit_count("some-non-number")


def test_case_metrics():
    case = Case()
    case.add_metric("exam_time", 42)
    case.start_timer("small_time")
    sleep(0.01)
    case.stop_timer("small_time")
    case.start_timer("start-without-stop-should-not-count")

    json = case.json()
    assert len(json.get("metrics")) == 2
    assert {"key": "exam_time", "value": 42} in json.get("metrics")

    binary = case.serialize()
    m = Message.GetRootAs(binary, 0)
    assert m.Metrics().EntriesLength() == 2
    assert m.Metrics().Entries(0).Key() == b"exam_time"
    v = m.Metrics().Entries(0).Value()
    assert v.ValueType() == Type.Int
    assert TypeCreator(v.ValueType(), v.Value()).value == 42


@pytest.fixture
def loaded_case() -> Case:
    type_handler = TypeHandler()
    case = Case()
    case.assume("username", type_handler.transform("potter"))
    case.check("name", type_handler.transform("harry"))
    case.check("dob", type_handler.transform(DateOfBirth(2000, 1, 1)))
    case.check("enroll_date", type_handler.transform(date(2018, 3, 1)))
    for course in ["math", "english"]:
        case.add_array_element("course-names", type_handler.transform(course))
        case.add_hit_count("course-count")
    return case
