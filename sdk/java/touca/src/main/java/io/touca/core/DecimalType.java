// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import io.touca.rules.ComparisonRule;

public final class DecimalType extends ToucaType {

  private final Double value;

  public DecimalType(final Double value) {
    super();
    this.value = value;
  }

  public DecimalType(final Float value) {
    super();
    this.value = Double.valueOf(value);
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
    return serialize(builder, null);
  }

  @Override
  public int serialize(final FlatBufferBuilder builder, final ComparisonRule rule) {
    int fbsRule = 0;
    if (rule != null) {
      fbsRule = rule.serialize(builder);
    }
    Schema.TDouble.startTDouble(builder);
    Schema.TDouble.addValue(builder, value);
    if (rule != null) {
      Schema.TDouble.addRule(builder, fbsRule);
    }
    final int fbsValue = Schema.TDouble.endTDouble(builder);
    Schema.TypeWrapper.startTypeWrapper(builder);
    Schema.TypeWrapper.addValue(builder, fbsValue);
    Schema.TypeWrapper.addValueType(builder, Schema.TType.TDouble);
    return Schema.TypeWrapper.endTypeWrapper(builder);
  }
}
