# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC, abstractmethod
from collections.abc import Iterable
from dataclasses import dataclass, field
from hashlib import sha256
from json import dumps
from mimetypes import guess_type
from pathlib import Path, PosixPath
from typing import Any, Callable, Dict, Type, Union

import touca_fbs as schema
from flatbuffers import Builder
from touca._rules import ComparisonRule


@dataclass
class Artifact:
    content: bytes = field(default=None, repr=False)
    digest: str = None
    mimetype: str = None
    reference: str = None

    @classmethod
    def from_file(cls, reference: Path):
        content = reference.read_bytes()
        digest = sha256(content).hexdigest()
        mimetype = guess_type(str(reference))[0]
        return cls(None, digest, mimetype, str(reference))

    @classmethod
    def from_bytes(cls, content: bytes):
        digest = sha256(content).hexdigest()
        return cls(content, digest, None, None)

    def binary(self):
        return self.content if self.content else Path(self.reference).read_bytes()

    def json(self):
        return self.reference if self.reference else str("BINARY")


class ToucaType(ABC):
    @abstractmethod
    def json(self):
        pass

    @abstractmethod
    def serialize(self, builder: Builder):
        pass

    def add_rule(self, rule: ComparisonRule = None):
        return self


class BlobType(ToucaType):
    def __init__(self, value: Union[bytes, Artifact]):
        self._value = Artifact.from_bytes(value) if isinstance(value, bytes) else value

    def json(self):
        return self._value.json()

    def serialize(self, builder: Builder):
        blob = Artifact()
        if self._value.digest:
            blob.digest = Builder.CreateString(builder, self._value.digest)
        if self._value.reference:
            blob.reference = Builder.CreateString(builder, self._value.reference)
        if self._value.mimetype:
            blob.mimetype = Builder.CreateString(builder, self._value.mimetype)
        schema.BlobStart(builder)
        if blob.digest:
            schema.BlobAddDigest(builder, blob.digest)
        if blob.mimetype:
            schema.BlobAddMimetype(builder, blob.mimetype)
        if blob.reference:
            schema.BlobAddReference(builder, blob.reference)
        value = schema.BlobEnd(builder)
        schema.TypeWrapperStart(builder)
        schema.TypeWrapperAddValue(builder, value)
        schema.TypeWrapperAddValueType(builder, schema.Type.Blob)
        return schema.TypeWrapperEnd(builder)


class BoolType(ToucaType):
    def __init__(self, value: bool):
        """
        Converts a given value of primitive type ``bool`` to a BoolType with
        known serialization into JSON and Binary.
        """
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
        self._rule: ComparisonRule = None

    def json(self):
        return self._value

    def serialize(self, builder: Builder):
        if self._rule:
            fbs_rule = self._rule.serialize(builder)
        schema.DoubleStart(builder)
        schema.DoubleAddValue(builder, self._value)
        if self._rule:
            schema.DoubleAddRule(builder, fbs_rule)
        value = schema.DoubleEnd(builder)
        schema.TypeWrapperStart(builder)
        schema.TypeWrapperAddValue(builder, value)
        schema.TypeWrapperAddValueType(builder, schema.Type.Double)
        return schema.TypeWrapperEnd(builder)

    def add_rule(self, rule: ComparisonRule = None):
        self._rule = rule
        return self


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
        for item in reversed(items):
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
            member_key = builder.CreateString(k)
            member_value = v.serialize(builder)
            schema.ObjectMemberStart(builder)
            schema.ObjectMemberAddName(builder, member_key)
            schema.ObjectMemberAddValue(builder, member_value)
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
        from datetime import date

        self._primitives: Dict[Type, Callable[[Any], ToucaType]] = {
            bool: BoolType,
            float: DecimalType,
            int: IntegerType,
            str: StringType,
            bytes: BlobType,
        }
        self._types = {
            date: (lambda x: dict(year=x.year, month=x.month, day=x.day)),
            PosixPath: (lambda x: str(x)),
        }

    def transform(self, value: Any):
        if type(value) in self._primitives:
            return self._primitives.get(type(value))(value)
        if type(value) in self._types:
            return self.transform(self._types.get(type(value))(value))
        if isinstance(value, dict):
            obj = ObjectType(value.__class__.__name__)
            for k, v in value.items():
                obj.add(k, self.transform(v))
            return obj
        if isinstance(value, Iterable):
            vec = VectorType()
            for v in value:
                vec.add(self.transform(v))
            return vec
        return self._objectify(value)

    def add_serializer(self, datatype: Type, serializer: Callable[[Any], Dict]):
        self._types[datatype] = serializer

    def _objectify(self, value: Any):
        obj = ObjectType(value.__class__.__name__)
        if hasattr(value, "__slots__"):
            if isinstance(value, Iterable):
                for k in value.__slots__:
                    obj.add(k, self.transform(getattr(value, k)))
        elif hasattr(value, "__dict__"):
            for k, v in value.__dict__.items():
                obj.add(k, self.transform(v))
        else:
            for k in dir(value):
                v = getattr(value, k)
                if k.startswith("_") or callable(v) or type(value) == type(v):
                    continue
                obj.add(k, self.transform(v))
        return obj
