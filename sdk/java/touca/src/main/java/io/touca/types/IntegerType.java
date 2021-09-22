// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import io.touca.schema.Schema;

public final class IntegerType extends ToucaType {

  private Long value;

  public IntegerType(final Integer value) {
    this.value = Long.valueOf(value);
  }

  public IntegerType(final Long value) {
    this.value = value;
  }

  public void increment() {
    value += 1;
  }

  @Override
  public final ToucaType.Types type() {
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
