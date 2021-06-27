#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from json import dumps
from abc import ABC, abstractmethod
from collections.abc import Iterable
from typing import Any, Callable, Dict, Type


class ToucaType(ABC):
    """ """

    @abstractmethod
    def json(self):
        pass


class BoolType(ToucaType):
    def __init__(self, value: bool):
        self._value = value

    def json(self):
        return self._value


class DecimalType(ToucaType):
    def __init__(self, value: float):
        self._value = value

    def json(self):
        return self._value


class IntegerType(ToucaType):
    def __init__(self, value: int):
        self._value = value

    def json(self):
        return self._value


class StringType(ToucaType):
    def __init__(self, value: str):
        self._value = value

    def json(self):
        return self._value


class VectorType(ToucaType):
    def __init__(self):
        self._values = []

    def add(self, value: ToucaType):
        self._values.append(value)

    def json(self):
        return dumps([v.json() for v in self._values])


class ObjectType(ToucaType):
    def __init__(self, key: str):
        self._name = key
        self._values = {}

    def add(self, key: str, value: ToucaType):
        self._values[key] = value

    def json(self):
        return dumps({k: v.json() for k, v in self._values.items()})


class TypeHandler:
    """ """

    def __init__(self):
        """ """
        self._primitives: Dict[Type, Callable[[Any], ToucaType]] = {
            bool: BoolType,
            float: DecimalType,
            int: IntegerType,
            str: StringType,
        }
        self._types = {}

    def transform(self, value: Any):
        """ """
        if type(value) in self._primitives:
            return self._primitives.get(type(value))(value)
        if type(value) in self._types:
            return self._types.get(type(value))(value)
        if isinstance(value, Iterable):
            vec = VectorType()
            for item in vec:
                vec.add(self.transform(item))
            return vec
        obj = ObjectType(value.__class__)
        for k, v in value.__dict__.items():
            obj.add(k, self.transform(v))
        return obj

    def register(self, type: Type, func: Callable[[Any], ToucaType]):
        """ """
        self._types[type] = func
