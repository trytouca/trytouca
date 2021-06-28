#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from json import dumps
from abc import ABC, abstractmethod
from collections.abc import Iterable
from flatbuffers import Builder
from typing import Any, Callable, Dict, Type
import touca._schema as schema


class ToucaType(ABC):
    @abstractmethod
    def json(self):
        pass

    @abstractmethod
    def serialize(self, builder: Builder):
        pass


class BoolType(ToucaType):
    def __init__(self, value: bool):
        self._value = value

    def json(self):
        return self._value

    def serialize(self, builder: Builder):
        schema.BoolStart(builder)
        schema.BoolAddValue(builder, value=self._value)
        value = schema.BoolEnd(builder)
        schema.TypeWrapperStart(builder)
        schema.TypeWrapperAddValue(builder, value)
        schema.TypeWrapperAddValueType(builder, schema.Type.Bool)
        return schema.TypeWrapperEnd(builder)


class DecimalType(ToucaType):
    def __init__(self, value: float):
        self._value = value

    def json(self):
        return self._value

    def serialize(self, builder: Builder):
        schema.DoubleStart(builder)
        schema.DoubleAddValue(builder, self._value)
        value = schema.DoubleEnd(builder)
        schema.TypeWrapperStart(builder)
        schema.TypeWrapperAddValue(builder, value)
        schema.TypeWrapperAddValueType(builder, schema.Type.Double)
        return schema.TypeWrapperEnd(builder)


class IntegerType(ToucaType):
    def __init__(self, value: int):
        self._value = value

    def json(self):
        return self._value

    def serialize(self, builder: Builder):
        schema.IntStart(builder)
        schema.IntAddValue(builder, self._value)
        value = schema.IntEnd(builder)
        schema.TypeWrapperStart(builder)
        schema.TypeWrapperAddValue(builder, value)
        schema.TypeWrapperAddValueType(builder, schema.Type.Int)
        return schema.TypeWrapperEnd(builder)


class StringType(ToucaType):
    def __init__(self, value: str):
        self._value = value

    def json(self):
        return self._value

    def serialize(self, builder: Builder):
        content = Builder.CreateString(builder, self._value)
        schema.StringStart(builder)
        schema.StringAddValue(builder, content)
        value = schema.StringEnd(builder)
        schema.TypeWrapperStart(builder)
        schema.TypeWrapperAddValue(builder, value)
        schema.TypeWrapperAddValueType(builder, schema.Type.String)
        return schema.TypeWrapperEnd(builder)


class VectorType(ToucaType):
    def __init__(self):
        self._values = []

    def add(self, value: ToucaType):
        self._values.append(value)

    def json(self):
        return dumps([v.json() for v in self._values])

    def serialize(self, builder: Builder):
        items = [v.serialize(builder) for v in self._values]
        schema.ArrayStartValuesVector(builder, len(items))
        for item in items:
            builder.PrependUOffsetTRelative(item)
        values = builder.EndVector()
        schema.ArrayStart(builder)
        schema.ArrayAddValues(builder, values)
        value = schema.ArrayEnd(builder)
        schema.TypeWrapperStart(builder)
        schema.TypeWrapperAddValue(builder, value)
        schema.TypeWrapperAddValueType(builder, schema.Type.Array)
        return schema.TypeWrapperEnd(builder)


class ObjectType(ToucaType):
    def __init__(self, key: str):
        self._name = key
        self._values = {}

    def add(self, key: str, value: ToucaType):
        self._values[key] = value

    def json(self):
        return dumps({k: v.json() for k, v in self._values.items()})

    def serialize(self, builder: Builder):
        key = builder.CreateString(self._name)
        members = []
        for k, v in self._values.items():
            memberkey = builder.CreateString(k)
            membervalue = v.serialize(builder)
            schema.ObjectMemberStart(builder)
            schema.ObjectMemberAddName(builder, memberkey)
            schema.ObjectMemberAddValue(builder, membervalue)
            members.append(schema.ObjectMemberEnd(builder))
        schema.ObjectStartValuesVector(builder, len(members))
        for item in reversed(members):
            builder.PrependUOffsetTRelative(item)
        values = builder.EndVector()
        schema.ObjectStart(builder)
        schema.ObjectAddKey(builder, key)
        schema.ObjectAddValues(builder, values)
        value = schema.ObjectEnd(builder)
        schema.TypeWrapperStart(builder)
        schema.TypeWrapperAddValue(builder, value)
        schema.TypeWrapperAddValueType(builder, schema.Type.Object)
        return schema.TypeWrapperEnd(builder)


class TypeHandler:
    def __init__(self):
        self._primitives: Dict[Type, Callable[[Any], ToucaType]] = {
            bool: BoolType,
            float: DecimalType,
            int: IntegerType,
            str: StringType,
        }
        self._types = {}

    def transform(self, value: Any):
        if type(value) in self._primitives:
            return self._primitives.get(type(value))(value)
        if type(value) in self._types:
            return self._types.get(type(value))(value)
        if isinstance(value, Iterable):
            vec = VectorType()
            for item in vec._values:
                vec.add(self.transform(item))
            return vec
        obj = ObjectType(value.__class__.__name__)
        for k, v in value.__dict__.items():
            obj.add(k, self.transform(v))
        return obj

    def register(self, type: Type, func: Callable[[Any], ToucaType]):
        self._types[type] = func
