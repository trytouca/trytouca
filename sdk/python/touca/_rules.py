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
    def absolute(self, *, min=None, max=None):
        self._mode = "absolute"
        self._min = min
        self._max = max
        return self

    def relative(self, *, max=None):
        self._mode = "relative"
        self._max = max
        return self

    def json(self):
        out = {"type": "number", "mode": self._mode, "max": self._max, "min": self._min}
        return {k: v for k, v in out.items() if v is not None}

    def serialize(self, builder: Builder):
        schema.DoubleRuleStart(builder)
        schema.DoubleRuleAddType(builder, schema.NumberComparisonRuleType.Absolute)
        if self._min:
            schema.DoubleRuleAddMin(builder, self._min)
        if self._max:
            schema.DoubleRuleAddMax(builder, self._max)
        return schema.DoubleRuleEnd(builder)


def number_rule():
    return NumberRule()
