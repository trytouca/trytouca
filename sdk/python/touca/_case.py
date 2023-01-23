# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Dict, Tuple

from touca._rules import ComparisonRule
from touca._types import Artifact, BlobType, IntegerType, ToucaType, VectorType


class ResultCategory(Enum):
    Check = 1
    Assert = 2


@dataclass
class ResultEntry:
    """
    Wrapper around a given ``ToucaType`` value that includes the category
    it should belong to.
    """

    typ: ResultCategory
    val: ToucaType
    rule: ComparisonRule = None


class Case:
    def __init__(self, **kwargs):
        self._meta = kwargs
        self._results: Dict[str, ResultEntry] = dict()
        self._tics: Dict[str, datetime] = dict()
        self._tocs: Dict[str, datetime] = dict()

    def check(self, key: str, value: ToucaType, rule: ComparisonRule = None):
        """
        Captures the value of a given variable as a data point for the declared
        test case and associates it with the specified key.

        :param key: name to be associated with the captured data point
        :param value: value to be captured as a test result
        :param rule: comparison rule for this test result
        """
        self._results[key] = ResultEntry(ResultCategory.Check, value, rule)

    def check_file(self, key: str, file: Path):
        """
        Captures an external file as a data point for the declared test case
        and associates it with the specified key.

        :param key: name to be associated with captured file
        :param path: path to the external file to be captured
        """
        self._results[key] = ResultEntry(
            typ=ResultCategory.Check, val=BlobType(Artifact.from_file(file))
        )

    def assume(self, key: str, value: ToucaType):
        """
        Logs a given value as an assertion for the declared test case
        and associates it with the specified key.

        :param key: name to be associated with the logged test result
        :param value: value to be logged as a test result
        """
        self._results[key] = ResultEntry(typ=ResultCategory.Assert, val=value)

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
            if primes:
                touca.check("prime numbers", primes)
                touca.check("number of primes", len(primes))

        The items added to the list are not required to be of the same type.
        The following code is acceptable:

        .. code-block:: python

            touca.check("prime numbers", 42)
            touca.check("prime numbers", "forty three")

        :raises RuntimeError:
            if specified key is already associated with
            a test result which was not iterable

        :param key: name to be associated with the logged test result
        :param value: element to be appended to the array
        :see also: :py:meth:`~check`
        """
        if key not in self._results:
            self._results[key] = ResultEntry(typ=ResultCategory.Check, val=VectorType())
        vec = self._results.get(key)
        if vec.typ is not ResultCategory.Check or not isinstance(vec.val, VectorType):
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
            if primes:
                touca.check("prime numbers", primes)
                touca.check("number of primes", len(primes))

        :raises RuntimeError:
            if specified key is already associated with
            a test result which was not an integer

        :param key: name to be associated with the logged test result
        :see also: :py:meth:`~check`
        """
        if key not in self._results:
            self._results[key] = ResultEntry(
                typ=ResultCategory.Check, val=IntegerType(1)
            )
            return
        value = self._results.get(key)
        if value.typ is not ResultCategory.Check or not isinstance(
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

        Expects function :py:meth:`~start_timer` to have been called previously
        with the specified name.

        :param key: name to be associated with the performance metric
        """
        if key in self._tics:
            self._tocs[key] = datetime.now()

    def _metrics(self) -> Tuple[str, ToucaType]:
        for key, tic in self._tics.items():
            if key not in self._tocs:
                continue
            diff = (self._tocs.get(key) - tic).total_seconds() * 1000
            yield key, IntegerType(int(diff))

    def _metadata(self) -> Dict[str, str]:
        return {
            "teamslug": self._meta.get("team") or "unknown",
            "testsuite": self._meta.get("suite") or "unknown",
            "version": self._meta.get("version") or "unknown",
            "testcase": self._meta.get("name") or "unknown",
            "builtAt": datetime.now().isoformat(),
        }

    def json(self):
        return {
            "metadata": self._metadata(),
            "results": [
                {"key": k, "value": v.val.json(), "rule": v.rule.json()}
                if v.rule
                else {"key": k, "value": v.val.json()}
                for k, v in self._results.items()
                if v.typ is ResultCategory.Check
            ],
            "assertions": [
                {"key": k, "value": v.val.json()}
                for k, v in self._results.items()
                if v.typ is ResultCategory.Assert
            ],
            "metrics": [{"key": k, "value": v.json()} for k, v in self._metrics()],
        }

    def serialize(self) -> bytearray:
        import touca_fbs as schema
        from flatbuffers import Builder

        dicts = {
            ResultCategory.Check: schema.ResultType.Check,
            ResultCategory.Assert: schema.ResultType.Assert,
        }
        builder = Builder()

        metadata = {k: builder.CreateString(v) for k, v in self._metadata().items()}
        schema.MetadataStart(builder)
        schema.MetadataAddTeamslug(builder, metadata.get("teamslug"))
        schema.MetadataAddTestsuite(builder, metadata.get("testsuite"))
        schema.MetadataAddVersion(builder, metadata.get("version"))
        schema.MetadataAddTestcase(builder, metadata.get("testcase"))
        schema.MetadataAddBuiltAt(builder, metadata.get("builtAt"))
        fbs_metadata = schema.MetadataEnd(builder)

        result_entries = []
        for k, v in self._results.items():
            fbs_key = Builder.CreateString(builder, k)
            fbs_value = v.val.add_rule(v.rule).serialize(builder)
            schema.ResultStart(builder)
            schema.ResultAddKey(builder, fbs_key)
            schema.ResultAddValue(builder, fbs_value)
            schema.ResultAddTyp(builder, dicts.get(v.typ))
            result_entries.append(schema.ResultEnd(builder))

        schema.ResultsStartEntriesVector(builder, len(result_entries))
        for item in reversed(result_entries):
            builder.PrependUOffsetTRelative(item)
        fbs_result_entries = builder.EndVector()

        schema.ResultsStart(builder)
        schema.ResultsAddEntries(builder, fbs_result_entries)
        fbs_results = schema.ResultsEnd(builder)

        metric_entries = []
        for k, v in self._metrics():
            fbs_key = Builder.CreateString(builder, k)
            fbs_value = v.serialize(builder)
            schema.MetricStart(builder)
            schema.MetricAddKey(builder, fbs_key)
            schema.MetricAddValue(builder, fbs_value)
            metric_entries.append(schema.MetricEnd(builder))

        schema.MetricsStartEntriesVector(builder, len(metric_entries))
        for item in reversed(metric_entries):
            builder.PrependUOffsetTRelative(item)
        fbs_metric_entries = builder.EndVector()

        schema.MetricsStart(builder)
        schema.MetricsAddEntries(builder, fbs_metric_entries)
        fbs_metrics = schema.MetricsEnd(builder)

        schema.MessageStart(builder)
        schema.MessageAddMetadata(builder, fbs_metadata)
        schema.MessageAddResults(builder, fbs_results)
        schema.MessageAddMetrics(builder, fbs_metrics)
        fbs_message = schema.MessageEnd(builder)

        builder.Finish(fbs_message)
        return builder.Output()
