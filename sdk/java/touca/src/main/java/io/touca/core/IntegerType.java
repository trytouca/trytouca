// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

public final class IntegerType extends ToucaType {

  private Long value;

  public IntegerType(final Integer value) {
    super();
    this.value = Long.valueOf(value);
  }

  public IntegerType(final Long value) {
    super();
    this.value = value;
  }

  public void increment() {
    value += 1;
  }

  @Override
  public ToucaType.Types type() {
    return ToucaType.Types.Number;
  }

  @Override
  public JsonElement json() {
    return new JsonPrimitive(value);
  }

  @Override
  public int serialize(final FlatBufferBuilder builder) {
    Schema.TInt.startTInt(builder);
    Schema.TInt.addValue(builder, value);
    final int fbsValue = Schema.TInt.endTInt(builder);
    Schema.TypeWrapper.startTypeWrapper(builder);
    Schema.TypeWrapper.addValue(builder, fbsValue);
    Schema.TypeWrapper.addValueType(builder, Schema.TType.TInt);
    return Schema.TypeWrapper.endTypeWrapper(builder);
  }
}
