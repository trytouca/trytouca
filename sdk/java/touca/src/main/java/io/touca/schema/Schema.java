// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.schema;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import com.google.flatbuffers.BaseVector;
import com.google.flatbuffers.ByteVector;
import com.google.flatbuffers.Constants;
import com.google.flatbuffers.FlatBufferBuilder;
import com.google.flatbuffers.Table;

public final class Schema {
  public static final class TType {
    private TType() {
    }

    public static final byte NONE = 0;
    public static final byte TBool = 1;
    public static final byte TInt = 2;
    public static final byte TUInt = 3;
    public static final byte TFloat = 4;
    public static final byte TDouble = 5;
    public static final byte TString = 6;
    public static final byte TObject = 7;
    public static final byte TArray = 8;

    public static final String[] names = { "NONE", "TBool", "TInt", "TUInt", "TFloat", "TDouble", "TString", "TObject",
        "TArray", };

    public static String name(int e) {
      return names[e];
    }
  }

  public static final class ResultType {
    private ResultType() {
    }

    public static final int Check = 1;
    public static final int Assert = 2;

    public static final String[] names = { "Check", "Assert", };

    public static String name(int e) {
      return names[e - Check];
    }
  }

  public static final class TypeWrapper extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static TypeWrapper getRootAsTypeWrapper(ByteBuffer _bb) {
      return getRootAsTypeWrapper(_bb, new TypeWrapper());
    }

    public static TypeWrapper getRootAsTypeWrapper(ByteBuffer _bb, TypeWrapper obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public TypeWrapper __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public byte valueType() {
      int o = __offset(4);
      return o != 0 ? bb.get(o + bb_pos) : 0;
    }

    public Table value(Table obj) {
      int o = __offset(6);
      return o != 0 ? __union(obj, o + bb_pos) : null;
    }

    public static int createTypeWrapper(FlatBufferBuilder builder, byte value_type, int valueOffset) {
      builder.startTable(2);
      TypeWrapper.addValue(builder, valueOffset);
      TypeWrapper.addValueType(builder, value_type);
      return TypeWrapper.endTypeWrapper(builder);
    }

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

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public TypeWrapper get(int j) {
        return get(new TypeWrapper(), j);
      }

      public TypeWrapper get(TypeWrapper obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class TBool extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static TBool getRootAsTBool(ByteBuffer _bb) {
      return getRootAsTBool(_bb, new TBool());
    }

    public static TBool getRootAsTBool(ByteBuffer _bb, TBool obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public TBool __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public boolean value() {
      int o = __offset(4);
      return o != 0 ? 0 != bb.get(o + bb_pos) : false;
    }

    public static int createBool(FlatBufferBuilder builder, boolean value) {
      builder.startTable(1);
      TBool.addValue(builder, value);
      return TBool.endBool(builder);
    }

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

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public TBool get(int j) {
        return get(new TBool(), j);
      }

      public TBool get(TBool obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class TInt extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static TInt getRootAsTInt(ByteBuffer _bb) {
      return getRootAsTInt(_bb, new TInt());
    }

    public static TInt getRootAsTInt(ByteBuffer _bb, TInt obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public TInt __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public long value() {
      int o = __offset(4);
      return o != 0 ? bb.getLong(o + bb_pos) : 0L;
    }

    public static int createTInt(FlatBufferBuilder builder, long value) {
      builder.startTable(1);
      TInt.addValue(builder, value);
      return TInt.endTInt(builder);
    }

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

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public TInt get(int j) {
        return get(new TInt(), j);
      }

      public TInt get(TInt obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class TUInt extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static TUInt getRootAsTUInt(ByteBuffer _bb) {
      return getRootAsTUInt(_bb, new TUInt());
    }

    public static TUInt getRootAsTUInt(ByteBuffer _bb, TUInt obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public TUInt __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public long value() {
      int o = __offset(4);
      return o != 0 ? bb.getLong(o + bb_pos) : 0L;
    }

    public static int createTUInt(FlatBufferBuilder builder, long value) {
      builder.startTable(1);
      TUInt.addValue(builder, value);
      return TUInt.endTUInt(builder);
    }

    public static void startTUInt(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValue(FlatBufferBuilder builder, long value) {
      builder.addLong(0, value, 0L);
    }

    public static int endTUInt(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public TUInt get(int j) {
        return get(new TUInt(), j);
      }

      public TUInt get(TUInt obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class TFloat extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static TFloat getRootAsTFloat(ByteBuffer _bb) {
      return getRootAsTFloat(_bb, new TFloat());
    }

    public static TFloat getRootAsTFloat(ByteBuffer _bb, TFloat obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public TFloat __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public float value() {
      int o = __offset(4);
      return o != 0 ? bb.getFloat(o + bb_pos) : 0.0f;
    }

    public static int createTFloat(FlatBufferBuilder builder, float value) {
      builder.startTable(1);
      TFloat.addValue(builder, value);
      return TFloat.endTFloat(builder);
    }

    public static void startTFloat(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValue(FlatBufferBuilder builder, float value) {
      builder.addFloat(0, value, 0.0f);
    }

    public static int endTFloat(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public TFloat get(int j) {
        return get(new TFloat(), j);
      }

      public TFloat get(TFloat obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class TDouble extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static TDouble getRootAsTDouble(ByteBuffer _bb) {
      return getRootAsTDouble(_bb, new TDouble());
    }

    public static TDouble getRootAsTDouble(ByteBuffer _bb, TDouble obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public TDouble __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public double value() {
      int o = __offset(4);
      return o != 0 ? bb.getDouble(o + bb_pos) : 0.0;
    }

    public static int createTDouble(FlatBufferBuilder builder, double value) {
      builder.startTable(1);
      TDouble.addValue(builder, value);
      return TDouble.endTDouble(builder);
    }

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

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public TDouble get(int j) {
        return get(new TDouble(), j);
      }

      public TDouble get(TDouble obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class TString extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static TString getRootAsTString(ByteBuffer _bb) {
      return getRootAsTString(_bb, new TString());
    }

    public static TString getRootAsTString(ByteBuffer _bb, TString obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public TString __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public String value() {
      int o = __offset(4);
      return o != 0 ? __string(o + bb_pos) : null;
    }

    public ByteBuffer valueAsByteBuffer() {
      return __vector_as_bytebuffer(4, 1);
    }

    public ByteBuffer valueInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 4, 1);
    }

    public static int createTString(FlatBufferBuilder builder, int valueOffset) {
      builder.startTable(1);
      TString.addValue(builder, valueOffset);
      return TString.endTString(builder);
    }

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

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public TString get(int j) {
        return get(new TString(), j);
      }

      public TString get(TString obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class TObjectMember extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static TObjectMember getRootAsTObjectMember(ByteBuffer _bb) {
      return getRootAsTObjectMember(_bb, new TObjectMember());
    }

    public static TObjectMember getRootAsTObjectMember(ByteBuffer _bb, TObjectMember obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public TObjectMember __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public String name() {
      int o = __offset(4);
      return o != 0 ? __string(o + bb_pos) : null;
    }

    public ByteBuffer nameAsByteBuffer() {
      return __vector_as_bytebuffer(4, 1);
    }

    public ByteBuffer nameInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 4, 1);
    }

    public TypeWrapper value() {
      return value(new TypeWrapper());
    }

    public TypeWrapper value(TypeWrapper obj) {
      int o = __offset(6);
      return o != 0 ? obj.__assign(__indirect(o + bb_pos), bb) : null;
    }

    public static int createTObjectMember(FlatBufferBuilder builder, int nameOffset, int valueOffset) {
      builder.startTable(2);
      TObjectMember.addValue(builder, valueOffset);
      TObjectMember.addName(builder, nameOffset);
      return TObjectMember.endTObjectMember(builder);
    }

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

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public TObjectMember get(int j) {
        return get(new TObjectMember(), j);
      }

      public TObjectMember get(TObjectMember obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class TObject extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static TObject getRootAsTObject(ByteBuffer _bb) {
      return getRootAsTObject(_bb, new TObject());
    }

    public static TObject getRootAsTObject(ByteBuffer _bb, TObject obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public TObject __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public String key() {
      int o = __offset(4);
      return o != 0 ? __string(o + bb_pos) : null;
    }

    public ByteBuffer keyAsByteBuffer() {
      return __vector_as_bytebuffer(4, 1);
    }

    public ByteBuffer keyInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 4, 1);
    }

    public TObjectMember values(int j) {
      return values(new TObjectMember(), j);
    }

    public TObjectMember values(TObjectMember obj, int j) {
      int o = __offset(6);
      return o != 0 ? obj.__assign(__indirect(__vector(o) + j * 4), bb) : null;
    }

    public int valuesLength() {
      int o = __offset(6);
      return o != 0 ? __vector_len(o) : 0;
    }

    public TObjectMember.Vector valuesVector() {
      return valuesVector(new TObjectMember.Vector());
    }

    public TObjectMember.Vector valuesVector(TObjectMember.Vector obj) {
      int o = __offset(6);
      return o != 0 ? obj.__assign(__vector(o), 4, bb) : null;
    }

    public static int createTObject(FlatBufferBuilder builder, int keyOffset, int valuesOffset) {
      builder.startTable(2);
      TObject.addValues(builder, valuesOffset);
      TObject.addKey(builder, keyOffset);
      return TObject.endTObject(builder);
    }

    public static void startTObject(FlatBufferBuilder builder) {
      builder.startTable(2);
    }

    public static void addKey(FlatBufferBuilder builder, int keyOffset) {
      builder.addOffset(0, keyOffset, 0);
    }

    public static void addValues(FlatBufferBuilder builder, int valuesOffset) {
      builder.addOffset(1, valuesOffset, 0);
    }

    public static int createValuesVector(FlatBufferBuilder builder, int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static void startValuesVector(FlatBufferBuilder builder, int numElems) {
      builder.startVector(4, numElems, 4);
    }

    public static int endTObject(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public TObject get(int j) {
        return get(new TObject(), j);
      }

      public TObject get(TObject obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class TArray extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static TArray getRootAsTArray(ByteBuffer _bb) {
      return getRootAsTArray(_bb, new TArray());
    }

    public static TArray getRootAsTArray(ByteBuffer _bb, TArray obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public TArray __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public TypeWrapper values(int j) {
      return values(new TypeWrapper(), j);
    }

    public TypeWrapper values(TypeWrapper obj, int j) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__indirect(__vector(o) + j * 4), bb) : null;
    }

    public int valuesLength() {
      int o = __offset(4);
      return o != 0 ? __vector_len(o) : 0;
    }

    public TypeWrapper.Vector valuesVector() {
      return valuesVector(new TypeWrapper.Vector());
    }

    public TypeWrapper.Vector valuesVector(TypeWrapper.Vector obj) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__vector(o), 4, bb) : null;
    }

    public static int createTArray(FlatBufferBuilder builder, int valuesOffset) {
      builder.startTable(1);
      TArray.addValues(builder, valuesOffset);
      return TArray.endTArray(builder);
    }

    public static void startTArray(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addValues(FlatBufferBuilder builder, int valuesOffset) {
      builder.addOffset(0, valuesOffset, 0);
    }

    public static int createValuesVector(FlatBufferBuilder builder, int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static void startValuesVector(FlatBufferBuilder builder, int numElems) {
      builder.startVector(4, numElems, 4);
    }

    public static int endTArray(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public TArray get(int j) {
        return get(new TArray(), j);
      }

      public TArray get(TArray obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class Result extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static Result getRootAsResult(ByteBuffer _bb) {
      return getRootAsResult(_bb, new Result());
    }

    public static Result getRootAsResult(ByteBuffer _bb, Result obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public Result __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public String key() {
      int o = __offset(4);
      return o != 0 ? __string(o + bb_pos) : null;
    }

    public ByteBuffer keyAsByteBuffer() {
      return __vector_as_bytebuffer(4, 1);
    }

    public ByteBuffer keyInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 4, 1);
    }

    public TypeWrapper value() {
      return value(new TypeWrapper());
    }

    public TypeWrapper value(TypeWrapper obj) {
      int o = __offset(6);
      return o != 0 ? obj.__assign(__indirect(o + bb_pos), bb) : null;
    }

    public int typ() {
      int o = __offset(8);
      return o != 0 ? bb.get(o + bb_pos) & 0xFF : 1;
    }

    public static int createResult(FlatBufferBuilder builder, int keyOffset, int valueOffset, int typ) {
      builder.startTable(3);
      Result.addValue(builder, valueOffset);
      Result.addKey(builder, keyOffset);
      Result.addTyp(builder, typ);
      return Result.endResult(builder);
    }

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

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public Result get(int j) {
        return get(new Result(), j);
      }

      public Result get(Result obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class Metric extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static Metric getRootAsMetric(ByteBuffer _bb) {
      return getRootAsMetric(_bb, new Metric());
    }

    public static Metric getRootAsMetric(ByteBuffer _bb, Metric obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public Metric __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public String key() {
      int o = __offset(4);
      return o != 0 ? __string(o + bb_pos) : null;
    }

    public ByteBuffer keyAsByteBuffer() {
      return __vector_as_bytebuffer(4, 1);
    }

    public ByteBuffer keyInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 4, 1);
    }

    public TypeWrapper value() {
      return value(new TypeWrapper());
    }

    public TypeWrapper value(TypeWrapper obj) {
      int o = __offset(6);
      return o != 0 ? obj.__assign(__indirect(o + bb_pos), bb) : null;
    }

    public static int createMetric(FlatBufferBuilder builder, int keyOffset, int valueOffset) {
      builder.startTable(2);
      Metric.addValue(builder, valueOffset);
      Metric.addKey(builder, keyOffset);
      return Metric.endMetric(builder);
    }

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

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public Metric get(int j) {
        return get(new Metric(), j);
      }

      public Metric get(Metric obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class Results extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static Results getRootAsResults(ByteBuffer _bb) {
      return getRootAsResults(_bb, new Results());
    }

    public static Results getRootAsResults(ByteBuffer _bb, Results obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public Results __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public Result entries(int j) {
      return entries(new Result(), j);
    }

    public Result entries(Result obj, int j) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__indirect(__vector(o) + j * 4), bb) : null;
    }

    public int entriesLength() {
      int o = __offset(4);
      return o != 0 ? __vector_len(o) : 0;
    }

    public Result.Vector entriesVector() {
      return entriesVector(new Result.Vector());
    }

    public Result.Vector entriesVector(Result.Vector obj) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__vector(o), 4, bb) : null;
    }

    public static int createResults(FlatBufferBuilder builder, int entriesOffset) {
      builder.startTable(1);
      Results.addEntries(builder, entriesOffset);
      return Results.endResults(builder);
    }

    public static void startResults(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addEntries(FlatBufferBuilder builder, int entriesOffset) {
      builder.addOffset(0, entriesOffset, 0);
    }

    public static int createEntriesVector(FlatBufferBuilder builder, int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static void startEntriesVector(FlatBufferBuilder builder, int numElems) {
      builder.startVector(4, numElems, 4);
    }

    public static int endResults(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public Results get(int j) {
        return get(new Results(), j);
      }

      public Results get(Results obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class Metrics extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static Metrics getRootAsMetrics(ByteBuffer _bb) {
      return getRootAsMetrics(_bb, new Metrics());
    }

    public static Metrics getRootAsMetrics(ByteBuffer _bb, Metrics obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public Metrics __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public Metric entries(int j) {
      return entries(new Metric(), j);
    }

    public Metric entries(Metric obj, int j) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__indirect(__vector(o) + j * 4), bb) : null;
    }

    public int entriesLength() {
      int o = __offset(4);
      return o != 0 ? __vector_len(o) : 0;
    }

    public Metric.Vector entriesVector() {
      return entriesVector(new Metric.Vector());
    }

    public Metric.Vector entriesVector(Metric.Vector obj) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__vector(o), 4, bb) : null;
    }

    public static int createMetrics(FlatBufferBuilder builder, int entriesOffset) {
      builder.startTable(1);
      Metrics.addEntries(builder, entriesOffset);
      return Metrics.endMetrics(builder);
    }

    public static void startMetrics(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addEntries(FlatBufferBuilder builder, int entriesOffset) {
      builder.addOffset(0, entriesOffset, 0);
    }

    public static int createEntriesVector(FlatBufferBuilder builder, int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static void startEntriesVector(FlatBufferBuilder builder, int numElems) {
      builder.startVector(4, numElems, 4);
    }

    public static int endMetrics(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public Metrics get(int j) {
        return get(new Metrics(), j);
      }

      public Metrics get(Metrics obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class Metadata extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static Metadata getRootAsMetadata(ByteBuffer _bb) {
      return getRootAsMetadata(_bb, new Metadata());
    }

    public static Metadata getRootAsMetadata(ByteBuffer _bb, Metadata obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public Metadata __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public String testsuite() {
      int o = __offset(4);
      return o != 0 ? __string(o + bb_pos) : null;
    }

    public ByteBuffer testsuiteAsByteBuffer() {
      return __vector_as_bytebuffer(4, 1);
    }

    public ByteBuffer testsuiteInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 4, 1);
    }

    public String version() {
      int o = __offset(6);
      return o != 0 ? __string(o + bb_pos) : null;
    }

    public ByteBuffer versionAsByteBuffer() {
      return __vector_as_bytebuffer(6, 1);
    }

    public ByteBuffer versionInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 6, 1);
    }

    public String testcase() {
      int o = __offset(10);
      return o != 0 ? __string(o + bb_pos) : null;
    }

    public ByteBuffer testcaseAsByteBuffer() {
      return __vector_as_bytebuffer(10, 1);
    }

    public ByteBuffer testcaseInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 10, 1);
    }

    public String builtAt() {
      int o = __offset(12);
      return o != 0 ? __string(o + bb_pos) : null;
    }

    public ByteBuffer builtAtAsByteBuffer() {
      return __vector_as_bytebuffer(12, 1);
    }

    public ByteBuffer builtAtInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 12, 1);
    }

    public String teamslug() {
      int o = __offset(14);
      return o != 0 ? __string(o + bb_pos) : null;
    }

    public ByteBuffer teamslugAsByteBuffer() {
      return __vector_as_bytebuffer(14, 1);
    }

    public ByteBuffer teamslugInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 14, 1);
    }

    public static int createMetadata(FlatBufferBuilder builder, int testsuiteOffset, int versionOffset,
        int testcaseOffset, int builtAtOffset, int teamslugOffset) {
      builder.startTable(6);
      Metadata.addTeamslug(builder, teamslugOffset);
      Metadata.addBuiltAt(builder, builtAtOffset);
      Metadata.addTestcase(builder, testcaseOffset);
      Metadata.addVersion(builder, versionOffset);
      Metadata.addTestsuite(builder, testsuiteOffset);
      return Metadata.endMetadata(builder);
    }

    public static void startMetadata(FlatBufferBuilder builder) {
      builder.startTable(6);
    }

    public static void addTestsuite(FlatBufferBuilder builder, int testsuiteOffset) {
      builder.addOffset(0, testsuiteOffset, 0);
    }

    public static void addVersion(FlatBufferBuilder builder, int versionOffset) {
      builder.addOffset(1, versionOffset, 0);
    }

    public static void addTestcase(FlatBufferBuilder builder, int testcaseOffset) {
      builder.addOffset(3, testcaseOffset, 0);
    }

    public static void addBuiltAt(FlatBufferBuilder builder, int builtAtOffset) {
      builder.addOffset(4, builtAtOffset, 0);
    }

    public static void addTeamslug(FlatBufferBuilder builder, int teamslugOffset) {
      builder.addOffset(5, teamslugOffset, 0);
    }

    public static int endMetadata(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public Metadata get(int j) {
        return get(new Metadata(), j);
      }

      public Metadata get(Metadata obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class Message extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static Message getRootAsMessage(ByteBuffer _bb) {
      return getRootAsMessage(_bb, new Message());
    }

    public static Message getRootAsMessage(ByteBuffer _bb, Message obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public Message __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public Metadata metadata() {
      return metadata(new Metadata());
    }

    public Metadata metadata(Metadata obj) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__indirect(o + bb_pos), bb) : null;
    }

    public Results results() {
      return results(new Results());
    }

    public Results results(Results obj) {
      int o = __offset(6);
      return o != 0 ? obj.__assign(__indirect(o + bb_pos), bb) : null;
    }

    public Metrics metrics() {
      return metrics(new Metrics());
    }

    public Metrics metrics(Metrics obj) {
      int o = __offset(10);
      return o != 0 ? obj.__assign(__indirect(o + bb_pos), bb) : null;
    }

    public static int createMessage(FlatBufferBuilder builder, int metadataOffset, int resultsOffset,
        int metricsOffset) {
      builder.startTable(4);
      Message.addMetrics(builder, metricsOffset);
      Message.addResults(builder, resultsOffset);
      Message.addMetadata(builder, metadataOffset);
      return Message.endMessage(builder);
    }

    public static void startMessage(FlatBufferBuilder builder) {
      builder.startTable(4);
    }

    public static void addMetadata(FlatBufferBuilder builder, int metadataOffset) {
      builder.addOffset(0, metadataOffset, 0);
    }

    public static void addResults(FlatBufferBuilder builder, int resultsOffset) {
      builder.addOffset(1, resultsOffset, 0);
    }

    public static void addMetrics(FlatBufferBuilder builder, int metricsOffset) {
      builder.addOffset(3, metricsOffset, 0);
    }

    public static int endMessage(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public Message get(int j) {
        return get(new Message(), j);
      }

      public Message get(Message obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class MessageBuffer extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static MessageBuffer getRootAsMessageBuffer(ByteBuffer _bb) {
      return getRootAsMessageBuffer(_bb, new MessageBuffer());
    }

    public static MessageBuffer getRootAsMessageBuffer(ByteBuffer _bb, MessageBuffer obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public MessageBuffer __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public int buf(int j) {
      int o = __offset(4);
      return o != 0 ? bb.get(__vector(o) + j * 1) & 0xFF : 0;
    }

    public int bufLength() {
      int o = __offset(4);
      return o != 0 ? __vector_len(o) : 0;
    }

    public ByteVector bufVector() {
      return bufVector(new ByteVector());
    }

    public ByteVector bufVector(ByteVector obj) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__vector(o), bb) : null;
    }

    public ByteBuffer bufAsByteBuffer() {
      return __vector_as_bytebuffer(4, 1);
    }

    public ByteBuffer bufInByteBuffer(ByteBuffer _bb) {
      return __vector_in_bytebuffer(_bb, 4, 1);
    }

    public Message bufAsMessage() {
      return bufAsMessage(new Message());
    }

    public Message bufAsMessage(Message obj) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__indirect(__vector(o)), bb) : null;
    }

    public static int createMessageBuffer(FlatBufferBuilder builder, int bufOffset) {
      builder.startTable(1);
      MessageBuffer.addBuf(builder, bufOffset);
      return MessageBuffer.endMessageBuffer(builder);
    }

    public static void startMessageBuffer(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addBuf(FlatBufferBuilder builder, int bufOffset) {
      builder.addOffset(0, bufOffset, 0);
    }

    public static int createBufVector(FlatBufferBuilder builder, byte[] data) {
      return builder.createByteVector(data);
    }

    public static int createBufVector(FlatBufferBuilder builder, ByteBuffer data) {
      return builder.createByteVector(data);
    }

    public static void startBufVector(FlatBufferBuilder builder, int numElems) {
      builder.startVector(1, numElems, 1);
    }

    public static int endMessageBuffer(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public MessageBuffer get(int j) {
        return get(new MessageBuffer(), j);
      }

      public MessageBuffer get(MessageBuffer obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

  public static final class Messages extends Table {
    public static void ValidateVersion() {
      Constants.FLATBUFFERS_2_0_0();
    }

    public static Messages getRootAsMessages(ByteBuffer _bb) {
      return getRootAsMessages(_bb, new Messages());
    }

    public static Messages getRootAsMessages(ByteBuffer _bb, Messages obj) {
      _bb.order(ByteOrder.LITTLE_ENDIAN);
      return (obj.__assign(_bb.getInt(_bb.position()) + _bb.position(), _bb));
    }

    public void __init(int _i, ByteBuffer _bb) {
      __reset(_i, _bb);
    }

    public Messages __assign(int _i, ByteBuffer _bb) {
      __init(_i, _bb);
      return this;
    }

    public MessageBuffer messages(int j) {
      return messages(new MessageBuffer(), j);
    }

    public MessageBuffer messages(MessageBuffer obj, int j) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__indirect(__vector(o) + j * 4), bb) : null;
    }

    public int messagesLength() {
      int o = __offset(4);
      return o != 0 ? __vector_len(o) : 0;
    }

    public MessageBuffer.Vector messagesVector() {
      return messagesVector(new MessageBuffer.Vector());
    }

    public MessageBuffer.Vector messagesVector(MessageBuffer.Vector obj) {
      int o = __offset(4);
      return o != 0 ? obj.__assign(__vector(o), 4, bb) : null;
    }

    public static int createMessages(FlatBufferBuilder builder, int messagesOffset) {
      builder.startTable(1);
      Messages.addMessages(builder, messagesOffset);
      return Messages.endMessages(builder);
    }

    public static void startMessages(FlatBufferBuilder builder) {
      builder.startTable(1);
    }

    public static void addMessages(FlatBufferBuilder builder, int messagesOffset) {
      builder.addOffset(0, messagesOffset, 0);
    }

    public static int createMessagesVector(FlatBufferBuilder builder, int[] data) {
      builder.startVector(4, data.length, 4);
      for (int i = data.length - 1; i >= 0; i--)
        builder.addOffset(data[i]);
      return builder.endVector();
    }

    public static void startMessagesVector(FlatBufferBuilder builder, int numElems) {
      builder.startVector(4, numElems, 4);
    }

    public static int endMessages(FlatBufferBuilder builder) {
      int o = builder.endTable();
      return o;
    }

    public static void finishMessagesBuffer(FlatBufferBuilder builder, int offset) {
      builder.finish(offset);
    }

    public static void finishSizePrefixedMessagesBuffer(FlatBufferBuilder builder, int offset) {
      builder.finishSizePrefixed(offset);
    }

    public static final class Vector extends BaseVector {
      public Vector __assign(int _vector, int _element_size, ByteBuffer _bb) {
        __reset(_vector, _element_size, _bb);
        return this;
      }

      public Messages get(int j) {
        return get(new Messages(), j);
      }

      public Messages get(Messages obj, int j) {
        return obj.__assign(__indirect(__element(j), bb), bb);
      }
    }
  }

}
