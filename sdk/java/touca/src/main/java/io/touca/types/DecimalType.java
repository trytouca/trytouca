// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

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
    return new JsonPrimitive(this.value);
  }
}
