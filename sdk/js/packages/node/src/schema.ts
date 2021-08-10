// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Builder, ByteBuffer, Long, Offset } from 'flatbuffers';

export enum Type {
  NONE = 0,
  Bool = 1,
  Int = 2,
  UInt = 3,
  Float = 4,
  Double = 5,
  String = 6,
  Object = 7,
  Array = 8
}

export enum ResultType {
  Check = 1,
  Assert = 2
}

export class TypeWrapper {
  static startTypeWrapper(builder: Builder): void {
    builder.startObject(2);
  }

  static addValueType(builder: Builder, valueType: Type): void {
    builder.addFieldInt8(0, valueType, Type.NONE);
  }

  static addValue(builder: Builder, valueOffset: Offset): void {
    builder.addFieldOffset(1, valueOffset, 0);
  }

  static endTypeWrapper(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Bool {
  static startBool(builder: Builder): void {
    builder.startObject(1);
  }

  static addValue(builder: Builder, value: boolean): void {
    builder.addFieldInt8(0, +value, +false);
  }

  static endBool(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Int {
  static startInt(builder: Builder): void {
    builder.startObject(1);
  }

  static addValue(builder: Builder, value: Long): void {
    builder.addFieldInt64(0, value, builder.createLong(0, 0));
  }

  static endInt(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class UInt {
  static startUInt(builder: Builder): void {
    builder.startObject(1);
  }

  static addValue(builder: Builder, value: Long): void {
    builder.addFieldInt64(0, value, builder.createLong(0, 0));
  }

  static endUInt(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}
export class Float {
  static startFloat(builder: Builder): void {
    builder.startObject(1);
  }

  static addValue(builder: Builder, value: number): void {
    builder.addFieldFloat32(0, value, 0.0);
  }

  static endFloat(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Double {
  static startDouble(builder: Builder): void {
    builder.startObject(1);
  }

  static addValue(builder: Builder, value: number): void {
    builder.addFieldFloat64(0, value, 0.0);
  }

  static endDouble(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class T_String {
  static startString(builder: Builder): void {
    builder.startObject(1);
  }

  static addValue(builder: Builder, valueOffset: Offset): void {
    builder.addFieldOffset(0, valueOffset, 0);
  }

  static endString(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class ObjectMember {
  static startObjectMember(builder: Builder): void {
    builder.startObject(2);
  }

  static addName(builder: Builder, nameOffset: Offset): void {
    builder.addFieldOffset(0, nameOffset, 0);
  }

  static addValue(builder: Builder, valueOffset: Offset): void {
    builder.addFieldOffset(1, valueOffset, 0);
  }

  static endObjectMember(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class T_Object {
  static startObject(builder: Builder): void {
    builder.startObject(2);
  }

  static addKey(builder: Builder, keyOffset: Offset): void {
    builder.addFieldOffset(0, keyOffset, 0);
  }

  static addValues(builder: Builder, valuesOffset: Offset): void {
    builder.addFieldOffset(1, valuesOffset, 0);
  }

  static createValuesVector(builder: Builder, data: Offset[]): Offset {
    builder.startVector(4, data.length, 4);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addOffset(data[i]);
    }
    return builder.endVector();
  }

  static startValuesVector(builder: Builder, numElems: number): void {
    builder.startVector(4, numElems, 4);
  }

  static endObject(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Array {
  static startArray(builder: Builder): void {
    builder.startObject(1);
  }

  static addValues(builder: Builder, valuesOffset: Offset): void {
    builder.addFieldOffset(0, valuesOffset, 0);
  }

  static createValuesVector(builder: Builder, data: Offset[]): Offset {
    builder.startVector(4, data.length, 4);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addOffset(data[i]);
    }
    return builder.endVector();
  }

  static startValuesVector(builder: Builder, numElems: number): void {
    builder.startVector(4, numElems, 4);
  }

  static endArray(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Result {
  static startResult(builder: Builder): void {
    builder.startObject(3);
  }

  static addKey(builder: Builder, keyOffset: Offset): void {
    builder.addFieldOffset(0, keyOffset, 0);
  }

  static addValue(builder: Builder, valueOffset: Offset): void {
    builder.addFieldOffset(1, valueOffset, 0);
  }

  static addTyp(builder: Builder, typ: ResultType): void {
    builder.addFieldInt8(2, typ, ResultType.Check);
  }

  static endResult(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Assertion {
  static startAssertion(builder: Builder): void {
    builder.startObject(2);
  }

  static endAssertion(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Metric {
  static startMetric(builder: Builder): void {
    builder.startObject(2);
  }

  static addKey(builder: Builder, keyOffset: Offset): void {
    builder.addFieldOffset(0, keyOffset, 0);
  }

  static addValue(builder: Builder, valueOffset: Offset): void {
    builder.addFieldOffset(1, valueOffset, 0);
  }

  static endMetric(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}
export class Results {
  static startResults(builder: Builder): void {
    builder.startObject(1);
  }

  static addEntries(builder: Builder, entriesOffset: Offset): void {
    builder.addFieldOffset(0, entriesOffset, 0);
  }

  static createEntriesVector(builder: Builder, data: Offset[]): Offset {
    builder.startVector(4, data.length, 4);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addOffset(data[i]);
    }
    return builder.endVector();
  }

  static startEntriesVector(builder: Builder, numElems: number): void {
    builder.startVector(4, numElems, 4);
  }

  static endResults(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Assertions {
  static startAssertions(builder: Builder): void {
    builder.startObject(1);
  }

  static endAssertions(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Metrics {
  static startMetrics(builder: Builder): void {
    builder.startObject(1);
  }

  static addEntries(builder: Builder, entriesOffset: Offset): void {
    builder.addFieldOffset(0, entriesOffset, 0);
  }

  static createEntriesVector(builder: Builder, data: Offset[]): Offset {
    builder.startVector(4, data.length, 4);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addOffset(data[i]);
    }
    return builder.endVector();
  }

  static startEntriesVector(builder: Builder, numElems: number): void {
    builder.startVector(4, numElems, 4);
  }

  static endMetrics(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Metadata {
  static startMetadata(builder: Builder): void {
    builder.startObject(6);
  }

  static addTestsuite(builder: Builder, testsuiteOffset: Offset): void {
    builder.addFieldOffset(0, testsuiteOffset, 0);
  }

  static addVersion(builder: Builder, versionOffset: Offset): void {
    builder.addFieldOffset(1, versionOffset, 0);
  }

  static addTestcase(builder: Builder, testcaseOffset: Offset): void {
    builder.addFieldOffset(3, testcaseOffset, 0);
  }

  static addBuiltAt(builder: Builder, builtAtOffset: Offset): void {
    builder.addFieldOffset(4, builtAtOffset, 0);
  }

  static addTeamslug(builder: Builder, teamslugOffset: Offset): void {
    builder.addFieldOffset(5, teamslugOffset, 0);
  }

  static endMetadata(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Message {
  static startMessage(builder: Builder): void {
    builder.startObject(4);
  }

  static addMetadata(builder: Builder, metadataOffset: Offset): void {
    builder.addFieldOffset(0, metadataOffset, 0);
  }

  static addResults(builder: Builder, resultsOffset: Offset): void {
    builder.addFieldOffset(1, resultsOffset, 0);
  }

  static addMetrics(builder: Builder, metricsOffset: Offset): void {
    builder.addFieldOffset(3, metricsOffset, 0);
  }

  static endMessage(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class MessageBuffer {
  static startMessageBuffer(builder: Builder): void {
    builder.startObject(1);
  }

  static addBuf(builder: Builder, bufOffset: Offset): void {
    builder.addFieldOffset(0, bufOffset, 0);
  }

  static createBufVector(
    builder: Builder,
    data: number[] | Uint8Array
  ): Offset {
    builder.startVector(1, data.length, 1);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addInt8(data[i]);
    }
    return builder.endVector();
  }

  static startBufVector(builder: Builder, numElems: number): void {
    builder.startVector(1, numElems, 1);
  }

  static endMessageBuffer(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Messages {
  static startMessages(builder: Builder): void {
    builder.startObject(1);
  }

  static addMessages(builder: Builder, messagesOffset: Offset): void {
    builder.addFieldOffset(0, messagesOffset, 0);
  }

  static createMessagesVector(builder: Builder, data: Offset[]): Offset {
    builder.startVector(4, data.length, 4);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addOffset(data[i]);
    }
    return builder.endVector();
  }

  static startMessagesVector(builder: Builder, numElems: number): void {
    builder.startVector(4, numElems, 4);
  }

  static endMessages(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }

  static finishMessagesBuffer(builder: Builder, offset: Offset): void {
    builder.finish(offset);
  }
}
