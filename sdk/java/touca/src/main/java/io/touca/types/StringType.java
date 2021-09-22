// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

public final class StringType extends ToucaType {
  private String value;

  public StringType(final String value) {
    this.value = value;
  }

  @Override
  public final ToucaType.Types type() {
    return ToucaType.Types.String;
  }

  @Override
  public JsonElement json() {
    return new JsonPrimitive(value);
  }
}
