// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.flatbuffers.Table;

public final class Schema {

  private Schema() {
  }

  public static final class TType {
    public static final byte NONE = 0;
    public static final byte TBool = 1;
    public static final byte TInt = 2;
    public static final byte TUInt = 3;
    public static final byte TFloat = 4;
    public static final byte TDouble = 5;
    public static final byte TString = 6;
    public static final byte TObject = 7;
    public static final byte TArray = 8;
    public static final byte TBlob = 9;

    private TType() {
    }
  }

  public static final class ComparisonRuleMode {
    public static final int Absolute = 0;
    public static final int Relative = 1;

    private ComparisonRuleMode() {
    }
  }

  public static final class ResultType {
    public static final int Check = 1;
    public static final int Assert = 2;

    private ResultType() {
    }
  }

  public static final class ComparisonRuleDouble extends Table {
    public static void startComparisonRuleDouble(final FlatBufferBuilder builder) {
      builder.startTable(4);
    }

    public static void addMode(final FlatBufferBuilder builder, final int mode) {
      builder.addByte(0, (byte) mode, (byte) 0);
    }

    public static void addMax(final FlatBufferBuilder builder, final double max) {
      builder.addDouble(1, max, 0.0);
    }

    public static void addMin(final FlatBufferBuilder builder, final double min) {
      builder.addDouble(2, min, 0.0);
    }

    public static void addPercent(final FlatBufferBuilder builder, final boolean percent) {
      builder.addBoolean(3, percent, false);
    }

    public static int endComparisonRuleDouble(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class TypeWrapper extends Table {

    public static void startTypeWrapper(final FlatBufferBuilder builder) {
      builder.startTable(2);
    }

    public static void addValueType(final FlatBufferBuilder builder,
        final byte valueType) {
      builder.addByte(0, valueType, 0);
    }

    public static void addValue(final FlatBufferBuilder builder,
        final int valueOffset) {
      builder.addOffset(1, valueOffset, 0);
    }

    public static int endTypeWrapper(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class TBool extends Table {

    public static void startBool(final FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValue(final FlatBufferBuilder builder,
        final boolean value) {
      builder.addBoolean(0, value, false);
    }

    public static int endBool(final FlatBufferBuilder builder) {
      return builder.endTable();
    }

  }

  public static final class TInt extends Table {
    public static void startTInt(final FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValue(final FlatBufferBuilder builder,
        final long value) {
      builder.addLong(0, value, 0L);
    }

    public static int endTInt(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class TDouble extends Table {

    public static void startTDouble(final FlatBufferBuilder builder) {
      builder.startTable(2);
    }

    public static void addValue(final FlatBufferBuilder builder,
        final double value) {
      builder.addDouble(0, value, 0.0);
    }

    public static void addRule(final FlatBufferBuilder builder, final int ruleOffset) {
      builder.addOffset(1, ruleOffset, 0);
    }

    public static int endTDouble(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class TString extends Table {

    public static void startTString(final FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValue(final FlatBufferBuilder builder,
        final int valueOffset) {
      builder.addOffset(0, valueOffset, 0);
    }

    public static int endTString(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class TObjectMember extends Table {

    public static void startTObjectMember(final FlatBufferBuilder builder) {
      builder.startTable(2);
    }

    public static void addName(final FlatBufferBuilder builder,
        final int nameOffset) {
      builder.addOffset(0, nameOffset, 0);
    }

    public static void addValue(final FlatBufferBuilder builder,
        final int valueOffset) {
      builder.addOffset(1, valueOffset, 0);
    }

    public static int endTObjectMember(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class TObject extends Table {

    public static void startTObject(final FlatBufferBuilder builder) {
      builder.startTable(2);
    }

    public static void addKey(final FlatBufferBuilder builder,
        final int keyOffset) {
      builder.addOffset(0, keyOffset, 0);
    }

    public static void addValues(final FlatBufferBuilder builder,
        final int valuesOffset) {
      builder.addOffset(1, valuesOffset, 0);
    }

    public static int createValuesVector(final FlatBufferBuilder builder,
        final int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static int endTObject(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class TArray extends Table {

    public static void startTArray(final FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValues(final FlatBufferBuilder builder,
        final int valuesOffset) {
      builder.addOffset(0, valuesOffset, 0);
    }

    public static int createValuesVector(final FlatBufferBuilder builder,
        final int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static int endTArray(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class TBlob extends Table {
    public static void startTBlob(final FlatBufferBuilder builder) {
      builder.startTable(3);
    }

    public static void addDigest(final FlatBufferBuilder builder,
        final int digestOffset) {
      builder.addOffset(0, digestOffset, 0);
    }

    public static void addMimetype(final FlatBufferBuilder builder,
        final int mimetypeOffset) {
      builder.addOffset(1, mimetypeOffset, 0);
    }

    public static void addReference(final FlatBufferBuilder builder,
        final int referenceOffset) {
      builder.addOffset(2, referenceOffset, 0);
    }

    public static int endTBlob(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class Result extends Table {

    public static void startResult(final FlatBufferBuilder builder) {
      builder.startTable(3);
    }

    public static void addKey(final FlatBufferBuilder builder,
        final int keyOffset) {
      builder.addOffset(0, keyOffset, 0);
    }

    public static void addValue(final FlatBufferBuilder builder,
        final int valueOffset) {
      builder.addOffset(1, valueOffset, 0);
    }

    public static void addTyp(final FlatBufferBuilder builder, final int typ) {
      builder.addByte(2, (byte) typ, (byte) 1);
    }

    public static int endResult(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class Metric extends Table {

    public static void startMetric(final FlatBufferBuilder builder) {
      builder.startTable(2);
    }

    public static void addKey(final FlatBufferBuilder builder,
        final int keyOffset) {
      builder.addOffset(0, keyOffset, 0);
    }

    public static void addValue(final FlatBufferBuilder builder,
        final int valueOffset) {
      builder.addOffset(1, valueOffset, 0);
    }

    public static int endMetric(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class Results extends Table {

    public static void startResults(final FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addEntries(final FlatBufferBuilder builder,
        final int entriesOffset) {
      builder.addOffset(0, entriesOffset, 0);
    }

    public static int createEntriesVector(final FlatBufferBuilder builder,
        final int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static int endResults(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class Metrics extends Table {

    public static void startMetrics(final FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addEntries(final FlatBufferBuilder builder,
        int entriesOffset) {
      builder.addOffset(0, entriesOffset, 0);
    }

    public static int createEntriesVector(final FlatBufferBuilder builder,
        final int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static int endMetrics(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class Metadata extends Table {

    public static void startMetadata(final FlatBufferBuilder builder) {
      builder.startTable(6);
    }

    public static void addTestsuite(final FlatBufferBuilder builder,
        final int testsuiteOffset) {
      builder.addOffset(0, testsuiteOffset, 0);
    }

    public static void addVersion(final FlatBufferBuilder builder,
        final int versionOffset) {
      builder.addOffset(1, versionOffset, 0);
    }

    public static void addTestcase(final FlatBufferBuilder builder,
        final int testcaseOffset) {
      builder.addOffset(3, testcaseOffset, 0);
    }

    public static void addBuiltAt(final FlatBufferBuilder builder,
        final int builtAtOffset) {
      builder.addOffset(4, builtAtOffset, 0);
    }

    public static void addTeamslug(final FlatBufferBuilder builder,
        final int teamslugOffset) {
      builder.addOffset(5, teamslugOffset, 0);
    }

    public static int endMetadata(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class Message extends Table {

    public static void startMessage(final FlatBufferBuilder builder) {
      builder.startTable(4);
    }

    public static void addMetadata(final FlatBufferBuilder builder,
        final int metadataOffset) {
      builder.addOffset(0, metadataOffset, 0);
    }

    public static void addResults(final FlatBufferBuilder builder,
        final int resultsOffset) {
      builder.addOffset(1, resultsOffset, 0);
    }

    public static void addMetrics(final FlatBufferBuilder builder,
        final int metricsOffset) {
      builder.addOffset(3, metricsOffset, 0);
    }

    public static int endMessage(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class MessageBuffer extends Table {

    public static void startMessageBuffer(final FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addBuf(final FlatBufferBuilder builder,
        final int bufOffset) {
      builder.addOffset(0, bufOffset, 0);
    }

    public static int createBufVector(final FlatBufferBuilder builder,
        final byte[] data) {
      return builder.createByteVector(data);
    }

    public static int endMessageBuffer(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

  public static final class Messages extends Table {
    public static void startMessages(final FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addMessages(final FlatBufferBuilder builder,
        final int messagesOffset) {
      builder.addOffset(0, messagesOffset, 0);
    }

    public static int createMessagesVector(final FlatBufferBuilder builder,
        final int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static int endMessages(final FlatBufferBuilder builder) {
      return builder.endTable();
    }
  }

}
