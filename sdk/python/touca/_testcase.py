#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from touca._types import DecimalType, IntegerType, VectorType, ToucaType
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum


class ResultValueType(Enum):
    """ """

    Check = 1
    Assert = 2


@dataclass
class ResultEntry:
    """ """

    typ: ResultValueType
    val: ToucaType


class Testcase:
    """ """

    def __init__(self, **kwargs):
        """ """
        self._meta = kwargs
        self._results = dict()
        self._tics = dict()
        self._tocs = dict()

    def _metrics(self):
        for key, tic in self._tics.items():
            if key not in self._tocs:
                continue
            diff = (self._tocs.get(key) - tic).microseconds / 1000
            yield key, DecimalType(diff)

    def add_result(self, key: str, value: ToucaType):
        """ """
        self._results[key] = ResultEntry(typ=ResultValueType.Check, val=value)

    def add_assertion(self, key: str, value: ToucaType):
        """ """
        self._results[key] = ResultEntry(typ=ResultValueType.Assert, val=value)

    def add_array_element(self, key: str, value: ToucaType):
        """ """
        if key not in self._results:
            self._results[key] = ResultEntry(
                typ=ResultValueType.Check, val=VectorType()
            )
        vec = self._results.get(key)
        if vec.typ is not ResultValueType.Check or not isinstance(vec.val, VectorType):
            raise RuntimeError("specified key has a different type")
        vec.val.add(value)

    def add_hit_count(self, key: str):
        """ """
        if key not in self._results:
            self._results[key] = ResultEntry(
                typ=ResultValueType.Check, val=IntegerType(1)
            )
            return
        value = self._results.get(key)
        if value.typ is not ResultValueType.Check or not isinstance(
            value.val, IntegerType
        ):
            raise RuntimeError("specified key has a different type")
        value.val._value += 1

    def add_metric(self, key: str, milliseconds: int):
        """ """
        value = datetime.now()
        self._tics[key] = value
        self._tocs[key] = value + timedelta(microseconds=milliseconds * 1000)

    def start_timer(self, key: str):
        """ """
        self._tics[key] = datetime.now()

    def stop_timer(self, key: str):
        """ """
        if key in self._tics:
            self._tocs[key] = datetime.now()

    def json(self):
        """ """
        return {
            "metadata": {
                "teamslug": self._meta.get("team") or "unknown",
                "testsuite": self._meta.get("suite") or "unknown",
                "version": self._meta.get("version") or "unknown",
                "testcase": self._meta.get("name") or "unknown",
                "builtAt": datetime.now().isoformat(),
            },
            "results": [
                {"key": k, "value": v.val.json()}
                for k, v in self._results.items()
                if v.typ is ResultValueType.Check
            ],
            "assertions": [
                {"key": k, "value": v.val.json()}
                for k, v in self._results.items()
                if v.typ is ResultValueType.Assert
            ],
            "metrics": [{"key": k, "value": v.json()} for k, v in self._metrics()],
        }
