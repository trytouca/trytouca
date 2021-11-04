// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import java.util.ArrayList;
import java.util.List;
import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;

public final class ArrayType extends ToucaType {
  final private List<ToucaType> elements = new ArrayList<>();

  public void add(final ToucaType value) {
    elements.add(value);
  }

  @Override
  public ToucaType.Types type() {
    return ToucaType.Types.Array;
  }

  @Override
  public JsonElement json() {
    final JsonArray array = new JsonArray();
    for (final ToucaType element : elements) {
      array.add(element.json());
    }
    return array;
  }

  @Override
  public int serialize(final FlatBufferBuilder builder) {
    final List<Integer> items = new ArrayList<>(this.elements.size());
    for (final ToucaType element : this.elements) {
      items.add(element.serialize(builder));
    }
    final int[] fbsItems = items.stream().mapToInt(x -> x).toArray();
    final int fbsValues = Schema.TArray.createValuesVector(builder, fbsItems);
    Schema.TArray.startTArray(builder);
    Schema.TArray.addValues(builder, fbsValues);
    final int fbsValue = Schema.TArray.endTArray(builder);
    Schema.TypeWrapper.startTypeWrapper(builder);
    Schema.TypeWrapper.addValue(builder, fbsValue);
    Schema.TypeWrapper.addValueType(builder, Schema.TType.TArray);
    return Schema.TypeWrapper.endTypeWrapper(builder);
  }
}
