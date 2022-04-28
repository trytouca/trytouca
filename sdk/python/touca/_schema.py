import flatbuffers


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


def BoolStart(builder):
    builder.StartObject(1)


def BoolAddValue(builder, value):
    builder.PrependBoolSlot(0, value, 0)


def BoolEnd(builder):
    return builder.EndObject()


def DoubleStart(builder):
    builder.StartObject(1)


def DoubleAddValue(builder, value):
    builder.PrependFloat64Slot(0, value, 0.0)


def DoubleEnd(builder):
    return builder.EndObject()


def IntStart(builder):
    builder.StartObject(1)


def IntAddValue(builder, value):
    builder.PrependInt64Slot(0, value, 0)


def IntEnd(builder):
    return builder.EndObject()


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
