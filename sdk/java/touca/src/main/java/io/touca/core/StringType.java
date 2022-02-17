// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

public final class StringType extends ToucaType {
  private final String value;

  public StringType(final String value) {
    super();
    this.value = value;
  }

  @Override
  public ToucaType.Types type() {
    return ToucaType.Types.String;
  }

  @Override
  public JsonElement json() {
    return new JsonPrimitive(value);
  }

  @Override
  public int serialize(final FlatBufferBuilder builder) {
    final int content = builder.createString(this.value);
    Schema.TString.startTString(builder);
    Schema.TString.addValue(builder, content);
    final int fbsValue = Schema.TString.endTString(builder);
    Schema.TypeWrapper.startTypeWrapper(builder);
    Schema.TypeWrapper.addValue(builder, fbsValue);
    Schema.TypeWrapper.addValueType(builder, Schema.TType.TString);
    return Schema.TypeWrapper.endTypeWrapper(builder);
  }
}
