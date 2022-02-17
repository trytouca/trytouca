// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

public final class BooleanType extends ToucaType {
  private final Boolean value;

  public BooleanType(final Boolean value) {
    super();
    this.value = value;
  }

  @Override
  public ToucaType.Types type() {
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
