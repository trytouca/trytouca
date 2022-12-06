// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Builder, Offset } from 'flatbuffers';

export enum Type {
  NONE = 0,
  Bool = 1,
  Int = 2,
  UInt = 3,
  Float = 4,
  Double = 5,
  String = 6,
  Object = 7,
  Array = 8,
  Blob = 9
}

export enum ComparisonRuleMode {
  Absolute = 0,
  Relative = 1
}

export enum ResultType {
  Check = 1,
  Assert = 2
}

export class ComparisonRuleDouble {
  static startComparisonRuleDouble(builder: Builder) {
    builder.startObject(4);
  }

  static addMode(builder: Builder, mode: ComparisonRuleMode) {
    builder.addFieldInt8(0, mode, ComparisonRuleMode.Absolute);
  }

  static addMax(builder: Builder, max: number) {
    builder.addFieldFloat64(1, max, 0);
  }

  static addMin(builder: Builder, min: number) {
    builder.addFieldFloat64(2, min, 0);
  }

  static addPercent(builder: Builder, percent: boolean) {
    builder.addFieldInt8(3, +percent, 0);
  }

  static endComparisonRuleDouble(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class TypeWrapper {
  static startTypeWrapper(builder: Builder) {
    builder.startObject(2);
  }

  static addValueType(builder: Builder, valueType: Type) {
    builder.addFieldInt8(0, valueType, Type.NONE);
  }

  static addValue(builder: Builder, valueOffset: Offset) {
    builder.addFieldOffset(1, valueOffset, 0);
  }

  static endTypeWrapper(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Bool {
  static startBool(builder: Builder) {
    builder.startObject(1);
  }

  static addValue(builder: Builder, value: boolean) {
    builder.addFieldInt8(0, +value, +false);
  }

  static endBool(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Int {
  static startInt(builder: Builder) {
    builder.startObject(1);
  }

  static addValue(builder: Builder, value: bigint) {
    builder.addFieldInt64(0, value, BigInt('0'));
  }

  static endInt(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Double {
  static startDouble(builder: Builder) {
    builder.startObject(2);
  }

  static addValue(builder: Builder, value: number) {
    builder.addFieldFloat64(0, value, 0.0);
  }

  static addRule(builder: Builder, ruleOffset: Offset) {
    builder.addFieldOffset(1, ruleOffset, 0);
  }

  static endDouble(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class T_String {
  static startString(builder: Builder) {
    builder.startObject(1);
  }

  static addValue(builder: Builder, valueOffset: Offset) {
    builder.addFieldOffset(0, valueOffset, 0);
  }

  static endString(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class ObjectMember {
  static startObjectMember(builder: Builder) {
    builder.startObject(2);
  }

  static addName(builder: Builder, nameOffset: Offset) {
    builder.addFieldOffset(0, nameOffset, 0);
  }

  static addValue(builder: Builder, valueOffset: Offset) {
    builder.addFieldOffset(1, valueOffset, 0);
  }

  static endObjectMember(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class T_Object {
  static startObject(builder: Builder) {
    builder.startObject(2);
  }

  static addKey(builder: Builder, keyOffset: Offset) {
    builder.addFieldOffset(0, keyOffset, 0);
  }

  static addValues(builder: Builder, valuesOffset: Offset) {
    builder.addFieldOffset(1, valuesOffset, 0);
  }

  static createValuesVector(builder: Builder, data: Offset[]): Offset {
    builder.startVector(4, data.length, 4);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addOffset(data[i]);
    }
    return builder.endVector();
  }

  static endObject(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Array {
  static startArray(builder: Builder) {
    builder.startObject(1);
  }

  static addValues(builder: Builder, valuesOffset: Offset) {
    builder.addFieldOffset(0, valuesOffset, 0);
  }

  static createValuesVector(builder: Builder, data: Offset[]): Offset {
    builder.startVector(4, data.length, 4);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addOffset(data[i]);
    }
    return builder.endVector();
  }

  static endArray(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Blob {
  static startBlob(builder: Builder) {
    builder.startObject(3);
  }

  static addDigest(builder: Builder, digestOffset: Offset) {
    builder.addFieldOffset(0, digestOffset, 0);
  }

  static addMimetype(builder: Builder, mimetypeOffset: Offset) {
    builder.addFieldOffset(1, mimetypeOffset, 0);
  }

  static addReference(builder: Builder, referenceOffset: Offset) {
    builder.addFieldOffset(2, referenceOffset, 0);
  }

  static endBlob(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Result {
  static startResult(builder: Builder) {
    builder.startObject(3);
  }

  static addKey(builder: Builder, keyOffset: Offset) {
    builder.addFieldOffset(0, keyOffset, 0);
  }

  static addValue(builder: Builder, valueOffset: Offset) {
    builder.addFieldOffset(1, valueOffset, 0);
  }

  static addTyp(builder: Builder, typ: ResultType) {
    builder.addFieldInt8(2, typ, ResultType.Check);
  }

  static endResult(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Metric {
  static startMetric(builder: Builder) {
    builder.startObject(2);
  }

  static addKey(builder: Builder, keyOffset: Offset) {
    builder.addFieldOffset(0, keyOffset, 0);
  }

  static addValue(builder: Builder, valueOffset: Offset) {
    builder.addFieldOffset(1, valueOffset, 0);
  }

  static endMetric(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Results {
  static startResults(builder: Builder) {
    builder.startObject(1);
  }

  static addEntries(builder: Builder, entriesOffset: Offset) {
    builder.addFieldOffset(0, entriesOffset, 0);
  }

  static createEntriesVector(builder: Builder, data: Offset[]): Offset {
    builder.startVector(4, data.length, 4);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addOffset(data[i]);
    }
    return builder.endVector();
  }

  static endResults(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Metrics {
  static startMetrics(builder: Builder) {
    builder.startObject(1);
  }

  static addEntries(builder: Builder, entriesOffset: Offset) {
    builder.addFieldOffset(0, entriesOffset, 0);
  }

  static createEntriesVector(builder: Builder, data: Offset[]): Offset {
    builder.startVector(4, data.length, 4);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addOffset(data[i]);
    }
    return builder.endVector();
  }

  static endMetrics(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Metadata {
  static startMetadata(builder: Builder) {
    builder.startObject(6);
  }

  static addTestsuite(builder: Builder, testsuiteOffset: Offset) {
    builder.addFieldOffset(0, testsuiteOffset, 0);
  }

  static addVersion(builder: Builder, versionOffset: Offset) {
    builder.addFieldOffset(1, versionOffset, 0);
  }

  static addTestcase(builder: Builder, testcaseOffset: Offset) {
    builder.addFieldOffset(3, testcaseOffset, 0);
  }

  static addBuiltAt(builder: Builder, builtAtOffset: Offset) {
    builder.addFieldOffset(4, builtAtOffset, 0);
  }

  static addTeamslug(builder: Builder, teamslugOffset: Offset) {
    builder.addFieldOffset(5, teamslugOffset, 0);
  }

  static endMetadata(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Message {
  static startMessage(builder: Builder) {
    builder.startObject(4);
  }

  static addMetadata(builder: Builder, metadataOffset: Offset) {
    builder.addFieldOffset(0, metadataOffset, 0);
  }

  static addResults(builder: Builder, resultsOffset: Offset) {
    builder.addFieldOffset(1, resultsOffset, 0);
  }

  static addMetrics(builder: Builder, metricsOffset: Offset) {
    builder.addFieldOffset(3, metricsOffset, 0);
  }

  static endMessage(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class MessageBuffer {
  static startMessageBuffer(builder: Builder) {
    builder.startObject(1);
  }

  static addBuf(builder: Builder, bufOffset: Offset) {
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

  static endMessageBuffer(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}

export class Messages {
  static startMessages(builder: Builder) {
    builder.startObject(1);
  }

  static addMessages(builder: Builder, messagesOffset: Offset) {
    builder.addFieldOffset(0, messagesOffset, 0);
  }

  static createMessagesVector(builder: Builder, data: Offset[]): Offset {
    builder.startVector(4, data.length, 4);
    for (let i = data.length - 1; i >= 0; i--) {
      builder.addOffset(data[i]);
    }
    return builder.endVector();
  }

  static endMessages(builder: Builder): Offset {
    const offset = builder.endObject();
    return offset;
  }
}
