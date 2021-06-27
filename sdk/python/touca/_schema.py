import flatbuffers


class Array(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsArray(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Array()
        x.Init(buf, n + offset)
        return x

    # Array
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Array
    def Values(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            obj = TypeWrapper()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # Array
    def ValuesLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0


def ArrayStart(builder):
    builder.StartObject(1)


def ArrayAddValues(builder, values):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(values), 0
    )


def ArrayStartValuesVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)


def ArrayEnd(builder):
    return builder.EndObject()


class Assertion(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsAssertion(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Assertion()
        x.Init(buf, n + offset)
        return x

    # Assertion
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)


def AssertionStart(builder):
    builder.StartObject(2)


def AssertionEnd(builder):
    return builder.EndObject()


class Assertions(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsAssertions(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Assertions()
        x.Init(buf, n + offset)
        return x

    # Assertions
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)


def AssertionsStart(builder):
    builder.StartObject(1)


def AssertionsEnd(builder):
    return builder.EndObject()


class Bool(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsBool(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Bool()
        x.Init(buf, n + offset)
        return x

    # Bool
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Bool
    def Value(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return bool(
                self._tab.Get(flatbuffers.number_types.BoolFlags, o + self._tab.Pos)
            )
        return False


def BoolStart(builder):
    builder.StartObject(1)


def BoolAddValue(builder, value):
    builder.PrependBoolSlot(0, value, 0)


def BoolEnd(builder):
    return builder.EndObject()


class Double(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsDouble(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Double()
        x.Init(buf, n + offset)
        return x

    # Double
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Double
    def Value(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.Get(
                flatbuffers.number_types.Float64Flags, o + self._tab.Pos
            )
        return 0.0


def DoubleStart(builder):
    builder.StartObject(1)


def DoubleAddValue(builder, value):
    builder.PrependFloat64Slot(0, value, 0.0)


def DoubleEnd(builder):
    return builder.EndObject()


class Float(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsFloat(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Float()
        x.Init(buf, n + offset)
        return x

    # Float
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Float
    def Value(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.Get(
                flatbuffers.number_types.Float32Flags, o + self._tab.Pos
            )
        return 0.0


def FloatStart(builder):
    builder.StartObject(1)


def FloatAddValue(builder, value):
    builder.PrependFloat32Slot(0, value, 0.0)


def FloatEnd(builder):
    return builder.EndObject()


class Int(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsInt(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Int()
        x.Init(buf, n + offset)
        return x

    # Int
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Int
    def Value(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Int64Flags, o + self._tab.Pos)
        return 0


def IntStart(builder):
    builder.StartObject(1)


def IntAddValue(builder, value):
    builder.PrependInt64Slot(0, value, 0)


def IntEnd(builder):
    return builder.EndObject()


class Message(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsMessage(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Message()
        x.Init(buf, n + offset)
        return x

    # Message
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Message
    def Metadata(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            obj = Metadata()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # Message
    def Results(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            obj = Results()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # Message
    def Metrics(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(10))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            obj = Metrics()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None


def MessageStart(builder):
    builder.StartObject(4)


def MessageAddMetadata(builder, metadata):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(metadata), 0
    )


def MessageAddResults(builder, results):
    builder.PrependUOffsetTRelativeSlot(
        1, flatbuffers.number_types.UOffsetTFlags.py_type(results), 0
    )


def MessageAddMetrics(builder, metrics):
    builder.PrependUOffsetTRelativeSlot(
        3, flatbuffers.number_types.UOffsetTFlags.py_type(metrics), 0
    )


def MessageEnd(builder):
    return builder.EndObject()


class MessageBuffer(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsMessageBuffer(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = MessageBuffer()
        x.Init(buf, n + offset)
        return x

    # MessageBuffer
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # MessageBuffer
    def Buf(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            a = self._tab.Vector(o)
            return self._tab.Get(
                flatbuffers.number_types.Uint8Flags,
                a + flatbuffers.number_types.UOffsetTFlags.py_type(j * 1),
            )
        return 0

    # MessageBuffer
    def BufAsNumpy(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.GetVectorAsNumpy(flatbuffers.number_types.Uint8Flags, o)
        return 0

    # MessageBuffer
    def BufLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0


def MessageBufferStart(builder):
    builder.StartObject(1)


def MessageBufferAddBuf(builder, buf):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(buf), 0
    )


def MessageBufferStartBufVector(builder, numElems):
    return builder.StartVector(1, numElems, 1)


def MessageBufferEnd(builder):
    return builder.EndObject()


class Messages(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsMessages(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Messages()
        x.Init(buf, n + offset)
        return x

    # Messages
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Messages
    def Messages(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            obj = MessageBuffer()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # Messages
    def MessagesLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0


def MessagesStart(builder):
    builder.StartObject(1)


def MessagesAddMessages(builder, messages):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(messages), 0
    )


def MessagesStartMessagesVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)


def MessagesEnd(builder):
    return builder.EndObject()


class Metadata(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsMetadata(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Metadata()
        x.Init(buf, n + offset)
        return x

    # Metadata
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Metadata
    def Testsuite(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # Metadata
    def Version(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # Metadata
    def Testcase(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(10))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # Metadata
    def BuiltAt(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(12))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # Metadata
    def Teamslug(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(14))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None


def MetadataStart(builder):
    builder.StartObject(6)


def MetadataAddTestsuite(builder, testsuite):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(testsuite), 0
    )


def MetadataAddVersion(builder, version):
    builder.PrependUOffsetTRelativeSlot(
        1, flatbuffers.number_types.UOffsetTFlags.py_type(version), 0
    )


def MetadataAddTestcase(builder, testcase):
    builder.PrependUOffsetTRelativeSlot(
        3, flatbuffers.number_types.UOffsetTFlags.py_type(testcase), 0
    )


def MetadataAddBuiltAt(builder, builtAt):
    builder.PrependUOffsetTRelativeSlot(
        4, flatbuffers.number_types.UOffsetTFlags.py_type(builtAt), 0
    )


def MetadataAddTeamslug(builder, teamslug):
    builder.PrependUOffsetTRelativeSlot(
        5, flatbuffers.number_types.UOffsetTFlags.py_type(teamslug), 0
    )


def MetadataEnd(builder):
    return builder.EndObject()


class Metric(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsMetric(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Metric()
        x.Init(buf, n + offset)
        return x

    # Metric
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Metric
    def Key(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # Metric
    def Value(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            obj = TypeWrapper()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None


def MetricStart(builder):
    builder.StartObject(2)


def MetricAddKey(builder, key):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(key), 0
    )


def MetricAddValue(builder, value):
    builder.PrependUOffsetTRelativeSlot(
        1, flatbuffers.number_types.UOffsetTFlags.py_type(value), 0
    )


def MetricEnd(builder):
    return builder.EndObject()


class Metrics(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsMetrics(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Metrics()
        x.Init(buf, n + offset)
        return x

    # Metrics
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Metrics
    def Entries(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            obj = Metric()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # Metrics
    def EntriesLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0


def MetricsStart(builder):
    builder.StartObject(1)


def MetricsAddEntries(builder, entries):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(entries), 0
    )


def MetricsStartEntriesVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)


def MetricsEnd(builder):
    return builder.EndObject()


class Object(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsObject(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Object()
        x.Init(buf, n + offset)
        return x

    # Object
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Object
    def Key(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # Object
    def Values(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            obj = ObjectMember()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # Object
    def ValuesLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0


def ObjectStart(builder):
    builder.StartObject(2)


def ObjectAddKey(builder, key):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(key), 0
    )


def ObjectAddValues(builder, values):
    builder.PrependUOffsetTRelativeSlot(
        1, flatbuffers.number_types.UOffsetTFlags.py_type(values), 0
    )


def ObjectStartValuesVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)


def ObjectEnd(builder):
    return builder.EndObject()


class ObjectMember(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsObjectMember(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = ObjectMember()
        x.Init(buf, n + offset)
        return x

    # ObjectMember
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # ObjectMember
    def Name(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # ObjectMember
    def Value(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            obj = TypeWrapper()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None


def ObjectMemberStart(builder):
    builder.StartObject(2)


def ObjectMemberAddName(builder, name):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(name), 0
    )


def ObjectMemberAddValue(builder, value):
    builder.PrependUOffsetTRelativeSlot(
        1, flatbuffers.number_types.UOffsetTFlags.py_type(value), 0
    )


def ObjectMemberEnd(builder):
    return builder.EndObject()


class Result(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsResult(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Result()
        x.Init(buf, n + offset)
        return x

    # Result
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Result
    def Key(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None

    # Result
    def Value(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            x = self._tab.Indirect(o + self._tab.Pos)
            obj = TypeWrapper()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # Result
    def Typ(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(8))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Uint8Flags, o + self._tab.Pos)
        return 1


def ResultStart(builder):
    builder.StartObject(3)


def ResultAddKey(builder, key):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(key), 0
    )


def ResultAddValue(builder, value):
    builder.PrependUOffsetTRelativeSlot(
        1, flatbuffers.number_types.UOffsetTFlags.py_type(value), 0
    )


def ResultAddTyp(builder, typ):
    builder.PrependUint8Slot(2, typ, 1)


def ResultEnd(builder):
    return builder.EndObject()


class ResultType(object):
    Check = 1
    Assert = 2


class Results(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsResults(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = Results()
        x.Init(buf, n + offset)
        return x

    # Results
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # Results
    def Entries(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            obj = Result()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # Results
    def EntriesLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0


def ResultsStart(builder):
    builder.StartObject(1)


def ResultsAddEntries(builder, entries):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(entries), 0
    )


def ResultsStartEntriesVector(builder, numElems):
    return builder.StartVector(4, numElems, 4)


def ResultsEnd(builder):
    return builder.EndObject()


class String(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsString(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = String()
        x.Init(buf, n + offset)
        return x

    # String
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # String
    def Value(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.String(o + self._tab.Pos)
        return None


def StringStart(builder):
    builder.StartObject(1)


def StringAddValue(builder, value):
    builder.PrependUOffsetTRelativeSlot(
        0, flatbuffers.number_types.UOffsetTFlags.py_type(value), 0
    )


def StringEnd(builder):
    return builder.EndObject()


class Type(object):
    NONE = 0
    Bool = 1
    Int = 2
    UInt = 3
    Float = 4
    Double = 5
    String = 6
    Object = 7
    Array = 8


class TypeWrapper(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsTypeWrapper(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = TypeWrapper()
        x.Init(buf, n + offset)
        return x

    # TypeWrapper
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # TypeWrapper
    def ValueType(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.Get(flatbuffers.number_types.Uint8Flags, o + self._tab.Pos)
        return 0

    # TypeWrapper
    def Value(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            obj = Table(bytearray(), 0)
            self._tab.Union(obj, o)
            return obj
        return None


def TypeWrapperStart(builder):
    builder.StartObject(2)


def TypeWrapperAddValueType(builder, valueType):
    builder.PrependUint8Slot(0, valueType, 0)


def TypeWrapperAddValue(builder, value):
    builder.PrependUOffsetTRelativeSlot(
        1, flatbuffers.number_types.UOffsetTFlags.py_type(value), 0
    )


def TypeWrapperEnd(builder):
    return builder.EndObject()


class UInt(object):
    __slots__ = ["_tab"]

    @classmethod
    def GetRootAsUInt(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = UInt()
        x.Init(buf, n + offset)
        return x

    # UInt
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # UInt
    def Value(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.Get(
                flatbuffers.number_types.Uint64Flags, o + self._tab.Pos
            )
        return 0


def UIntStart(builder):
    builder.StartObject(1)


def UIntAddValue(builder, value):
    builder.PrependUint64Slot(0, value, 0)


def UIntEnd(builder):
    return builder.EndObject()
