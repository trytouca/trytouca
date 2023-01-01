# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC, abstractmethod

import touca_fbs as schema
from flatbuffers import Builder


class ComparisonRule(ABC):
    @abstractmethod
    def json(self):
        pass

    @abstractmethod
    def serialize(self):
        pass


class decimal_rule(ComparisonRule):
    @classmethod
    def absolute(cls, *, min=None, max=None):
        return cls(
            mode=schema.ComparisonRuleMode.Absolute,
            min=min,
            max=max,
        )

    @classmethod
    def relative(cls, *, max=None, percent=False):
        return cls(
            mode=schema.ComparisonRuleMode.Relative,
            max=max,
            percent=percent,
        )

    def __init__(
        self,
        *,
        mode: schema.ComparisonRuleMode = None,
        min=None,
        max=None,
        percent=None
    ):
        self._mode = mode
        self._min = min
        self._max = max
        self._percent = percent

    def json(self):
        mode = (
            "absolute"
            if self._mode == schema.ComparisonRuleMode.Absolute
            else "relative"
        )
        out = {
            "type": "number",
            "mode": mode,
            "min": self._min,
            "max": self._max,
            "percent": self._percent,
        }
        return {k: v for k, v in out.items() if v is not None}

    def serialize(self, builder: Builder):
        schema.ComparisonRuleDoubleStart(builder)
        schema.ComparisonRuleDoubleAddMode(builder, self._mode)
        if self._min is not None:
            schema.ComparisonRuleDoubleAddMin(builder, self._min)
        if self._max is not None:
            schema.ComparisonRuleDoubleAddMax(builder, self._max)
        if self._percent is not None:
            schema.ComparisonRuleDoubleAddPercent(builder, self._percent)
        return schema.ComparisonRuleDoubleEnd(builder)
