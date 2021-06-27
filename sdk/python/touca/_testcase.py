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
        """
        Logs a given value as a test result for the declared test case
        and associates it with the specified key.

        :param key: name to be associated with the logged test result
        :param value: value to be logged as a test result
        """
        self._results[key] = ResultEntry(typ=ResultValueType.Check, val=value)

    def add_assertion(self, key: str, value: ToucaType):
        """
        Logs a given value as an assertion for the declared test case
        and associates it with the specified key.

        :param key: name to be associated with the logged test result
        :param value: value to be logged as a test result
        """
        self._results[key] = ResultEntry(typ=ResultValueType.Assert, val=value)

    def add_array_element(self, key: str, value: ToucaType):
        """
        Adds a given value to a list of results for the declared
        test case which is associated with the specified key.

        Could be considered as a helper utility function.
        This method is particularly helpful to log a list of items as they
        are found:

        .. code-block:: python

            for number in numbers:
                if is_prime(number):
                    touca.add_array_element("prime numbers", number)
                    touca.add_hit_count("number of primes")

        This pattern can be considered as a syntactic sugar for the following
        alternative:

        .. code-block:: python

            primes = []
            for number in numbers:
                if is_prime(number):
                    primes.append(number)
            if not primes:
                touca.add_result("prime numbers", primes)
                touca.add_result("number of primes", len(primes))

        The items added to the list are not required to be of the same type.
        The following code is acceptable:

        .. code-block:: python

            touca.add_result("prime numbers", 42)
            touca.add_result("prime numbers", "forty three")

        :raises RuntimeError:
            if specified key is already associated with
            a test result which was not iterable

        :param key: name to be associated with the logged test result
        :param value: element to be appended to the array
        :see also: :py:meth:`~add_result`
        """
        if key not in self._results:
            self._results[key] = ResultEntry(
                typ=ResultValueType.Check, val=VectorType()
            )
        vec = self._results.get(key)
        if vec.typ is not ResultValueType.Check or not isinstance(vec.val, VectorType):
            raise RuntimeError("specified key has a different type")
        vec.val.add(value)

    def add_hit_count(self, key: str):
        """
        Increments value of key every time it is executed.
        creates the key with initial value of one if it does not exist.

        Could be considered as a helper utility function.
        This method is particularly helpful to track variables whose values
        are determined in loops with indeterminate execution cycles:

        .. code-block:: python

            for number in numbers:
                if is_prime(number):
                    touca.add_array_element("prime numbers", number)
                    touca.add_hit_count("number of primes")

        This pattern can be considered as a syntactic sugar for the following
        alternative:

        .. code-block:: python

            primes = []
            for number in numbers:
                if is_prime(number):
                    primes.append(number)
            if not primes:
                touca.add_result("prime numbers", primes)
                touca.add_result("number of primes", len(primes))

        :raises RuntimeError:
            if specified key is already associated with
            a test result which was not an integer

        :param key: name to be associated with the logged test result
        :see also: :py:meth:`~add_result`
        """
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
        """
        Adds an already obtained measurements to the list of captured
        performance benchmarks.

        Useful for logging a metric that is measured without using this SDK.

        :param key: name to be associated with this performance benchmark
        :param milliseconds: duration of this measurement in milliseconds
        """
        value = datetime.now()
        self._tics[key] = value
        self._tocs[key] = value + timedelta(microseconds=milliseconds * 1000)

    def start_timer(self, key: str):
        """
        Starts timing an event with the specified name.

        Measurement of the event is only complete when function
        :py:meth:`~stop_timer` is later called for the specified name.

        :param key: name to be associated with the performance metric
        """
        self._tics[key] = datetime.now()

    def stop_timer(self, key: str):
        """
        Stops timing an event with the specified name.

        Expects function :py:meth:`~stop_timer` to have been called previously
        with the specified name.

        :param key: name to be associated with the performance metric
        """
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
