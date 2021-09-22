// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.schema;

import java.nio.ByteBuffer;
import com.google.flatbuffers.Constants;
import com.google.flatbuffers.FlatBufferBuilder;
import com.google.flatbuffers.Table;

public final class Schema {
  public static final class TType {
    private TType() {}

    public static final byte NONE = 0;
    public static final byte TBool = 1;
    public static final byte TInt = 2;
    public static final byte TUInt = 3;
    public static final byte TFloat = 4;
    public static final byte TDouble = 5;
    public static final byte TString = 6;
    public static final byte TObject = 7;
    public static final byte TArray = 8;
  }

  public static final class ResultType {
    private ResultType() {}

    public static final int Check = 1;
    public static final int Assert = 2;
  }

  public static final class TypeWrapper extends Table {

    public static void startTypeWrapper(FlatBufferBuilder builder) {
      builder.startTable(2);
    }

    public static void addValueType(FlatBufferBuilder builder, byte valueType) {
      builder.addByte(0, valueType, 0);
    }

    public static void addValue(FlatBufferBuilder builder, int valueOffset) {
      builder.addOffset(1, valueOffset, 0);
    }

    public static int endTypeWrapper(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class TBool extends Table {

    public static void startBool(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValue(FlatBufferBuilder builder, boolean value) {
      builder.addBoolean(0, value, false);
    }

    public static int endBool(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

  }

  public static final class TInt extends Table {
    public static void startTInt(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValue(FlatBufferBuilder builder, long value) {
      builder.addLong(0, value, 0L);
    }

    public static int endTInt(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class TDouble extends Table {

    public static void startTDouble(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValue(FlatBufferBuilder builder, double value) {
      builder.addDouble(0, value, 0.0);
    }

    public static int endTDouble(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class TString extends Table {

    public static void startTString(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValue(FlatBufferBuilder builder, int valueOffset) {
      builder.addOffset(0, valueOffset, 0);
    }

    public static int endTString(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class TObjectMember extends Table {

    public static void startTObjectMember(FlatBufferBuilder builder) {
      builder.startTable(2);
    }

    public static void addName(FlatBufferBuilder builder, int nameOffset) {
      builder.addOffset(0, nameOffset, 0);
    }

    public static void addValue(FlatBufferBuilder builder, int valueOffset) {
      builder.addOffset(1, valueOffset, 0);
    }

    public static int endTObjectMember(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class TObject extends Table {

    public static void startTObject(FlatBufferBuilder builder) {
      builder.startTable(2);
    }

    public static void addKey(FlatBufferBuilder builder, int keyOffset) {
      builder.addOffset(0, keyOffset, 0);
    }

    public static void addValues(FlatBufferBuilder builder, int valuesOffset) {
      builder.addOffset(1, valuesOffset, 0);
    }

    public static int createValuesVector(FlatBufferBuilder builder,
        int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static int endTObject(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class TArray extends Table {

    public static void startTArray(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValues(FlatBufferBuilder builder, int valuesOffset) {
      builder.addOffset(0, valuesOffset, 0);
    }

    public static int createValuesVector(FlatBufferBuilder builder,
        int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static int endTArray(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class Result extends Table {

    public static void startResult(FlatBufferBuilder builder) {
      builder.startTable(3);
    }

    public static void addKey(FlatBufferBuilder builder, int keyOffset) {
      builder.addOffset(0, keyOffset, 0);
    }

    public static void addValue(FlatBufferBuilder builder, int valueOffset) {
      builder.addOffset(1, valueOffset, 0);
    }

    public static void addTyp(FlatBufferBuilder builder, int typ) {
      builder.addByte(2, (byte) typ, (byte) 1);
    }

    public static int endResult(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class Metric extends Table {

    public static void startMetric(FlatBufferBuilder builder) {
      builder.startTable(2);
    }

    public static void addKey(FlatBufferBuilder builder, int keyOffset) {
      builder.addOffset(0, keyOffset, 0);
    }

    public static void addValue(FlatBufferBuilder builder, int valueOffset) {
      builder.addOffset(1, valueOffset, 0);
    }

    public static int endMetric(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class Results extends Table {

    public static void startResults(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addEntries(FlatBufferBuilder builder,
        int entriesOffset) {
      builder.addOffset(0, entriesOffset, 0);
    }

    public static int createEntriesVector(FlatBufferBuilder builder,
        int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static int endResults(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class Metrics extends Table {

    public static void startMetrics(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addEntries(FlatBufferBuilder builder,
        int entriesOffset) {
      builder.addOffset(0, entriesOffset, 0);
    }

    public static int createEntriesVector(FlatBufferBuilder builder,
        int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static int endMetrics(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class Metadata extends Table {

    public static void startMetadata(FlatBufferBuilder builder) {
      builder.startTable(6);
    }

    public static void addTestsuite(FlatBufferBuilder builder,
        int testsuiteOffset) {
      builder.addOffset(0, testsuiteOffset, 0);
    }

    public static void addVersion(FlatBufferBuilder builder,
        int versionOffset) {
      builder.addOffset(1, versionOffset, 0);
    }

    public static void addTestcase(FlatBufferBuilder builder,
        int testcaseOffset) {
      builder.addOffset(3, testcaseOffset, 0);
    }

    public static void addBuiltAt(FlatBufferBuilder builder,
        int builtAtOffset) {
      builder.addOffset(4, builtAtOffset, 0);
    }

    public static void addTeamslug(FlatBufferBuilder builder,
        int teamslugOffset) {
      builder.addOffset(5, teamslugOffset, 0);
    }

    public static int endMetadata(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class Message extends Table {

    public static void startMessage(FlatBufferBuilder builder) {
      builder.startTable(4);
    }

    public static void addMetadata(FlatBufferBuilder builder,
        int metadataOffset) {
      builder.addOffset(0, metadataOffset, 0);
    }

    public static void addResults(FlatBufferBuilder builder,
        int resultsOffset) {
      builder.addOffset(1, resultsOffset, 0);
    }

    public static void addMetrics(FlatBufferBuilder builder,
        int metricsOffset) {
      builder.addOffset(3, metricsOffset, 0);
    }

    public static int endMessage(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class MessageBuffer extends Table {

    public static void startMessageBuffer(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addBuf(FlatBufferBuilder builder, int bufOffset) {
      builder.addOffset(0, bufOffset, 0);
    }

    public static int createBufVector(FlatBufferBuilder builder, byte[] data) {
      return builder.createByteVector(data);
    }

    public static int endMessageBuffer(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

  public static final class Messages extends Table {
    public static void startMessages(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addMessages(FlatBufferBuilder builder,
        int messagesOffset) {
      builder.addOffset(0, messagesOffset, 0);
    }

    public static int createMessagesVector(FlatBufferBuilder builder,
        int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static int endMessages(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }
  }

}
