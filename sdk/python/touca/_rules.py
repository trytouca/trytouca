# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC, abstractmethod
from flatbuffers import Builder
import touca._schema as schema


class ComparisonRule(ABC):
    @abstractmethod
    def json(self):
        pass

    @abstractmethod
    def serialize(self):
        pass


class NumberRule(ComparisonRule):
    _percent: bool = None

    def absolute(self, *, max=None, min=None):
        self._mode = "absolute"
        self._max = max
        self._min = min
        return self

    def relative(self, *, max=None, percent=None):
        self._mode = "relative"
        self._max = max
        self._percent = percent
        return self

    def json(self):
        out = {
            "type": "number",
            "mode": self._mode,
            "max": self._max,
            "min": self._min,
            "percent": self._percent,
        }
        return {k: v for k, v in out.items() if v is not None}

    def serialize(self, builder: Builder):
        schema.ComparisonRuleDoubleStart(builder)
        schema.ComparisonRuleDoubleAddMode(
            builder,
            schema.ComparisonRuleMode.Absolute
            if self._mode == "absolute"
            else schema.ComparisonRuleMode.Relative,
        )
        if self._max:
            schema.ComparisonRuleDoubleAddMax(builder, self._max)
        if self._min:
            schema.ComparisonRuleDoubleAddMin(builder, self._min)
        if self._percent:
            schema.ComparisonRuleDoubleAddPercent(builder, self._percent)
        return schema.ComparisonRuleDoubleEnd(builder)


def number_rule():
    return NumberRule()
