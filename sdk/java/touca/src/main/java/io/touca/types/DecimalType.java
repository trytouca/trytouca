// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import io.touca.schema.Schema;

public final class DecimalType extends ToucaType {

  private Double value;

  public DecimalType(final Double value) {
    this.value = value;
  }

  public DecimalType(final Float value) {
    this.value = Double.valueOf(value);
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
    Schema.TDouble.startTDouble(builder);
    Schema.TDouble.addValue(builder, value);
    final int fbsValue = Schema.TDouble.endTDouble(builder);
    Schema.TypeWrapper.startTypeWrapper(builder);
    Schema.TypeWrapper.addValue(builder, fbsValue);
    Schema.TypeWrapper.addValueType(builder, Schema.TType.TDouble);
    return Schema.TypeWrapper.endTypeWrapper(builder);
  }
}
