// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import java.util.List;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;

public final class ArrayType extends ToucaType {
  private List<ToucaType> elements;

  public void add(final ToucaType value) {
    elements.add(value);
  }

  @Override
  public final ToucaType.Types type() {
    return ToucaType.Types.Array;
  }

  @Override
  public JsonElement json() {
    JsonArray array = new JsonArray();
    for (ToucaType element : elements) {
      array.add(element.json());
    }
    return array;
  }
}
