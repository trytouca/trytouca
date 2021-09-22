// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import io.touca.schema.Schema;

public final class BooleanType extends ToucaType {
  private Boolean value;

  public BooleanType(final Boolean value) {
    this.value = value;
  }

  @Override
  public final ToucaType.Types type() {
    return ToucaType.Types.Boolean;
  }

  @Override
  public JsonElement json() {
    return new JsonPrimitive(value);
  }

  @Override
  public int serialize(final FlatBufferBuilder builder) {
    Schema.TBool.startBool(builder);
    Schema.TBool.addValue(builder, value);
    final int fbsValue = Schema.TBool.endBool(builder);
    Schema.TypeWrapper.startTypeWrapper(builder);
    Schema.TypeWrapper.addValue(builder, fbsValue);
    Schema.TypeWrapper.addValueType(builder, Schema.TType.TBool);
    return Schema.TypeWrapper.endTypeWrapper(builder);
  }
}
