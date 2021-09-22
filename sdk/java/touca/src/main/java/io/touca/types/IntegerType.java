// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

public final class IntegerType extends ToucaType {

  private Long value;

  public IntegerType(final Integer value) {
    this.value = Long.valueOf(value);
  }

  public IntegerType(final Long value) {
    this.value = value;
  }

  public void increment() {
    this.value += 1;
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
