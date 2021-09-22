// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.List;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

public final class ObjectType extends ToucaType {
  private List<SimpleEntry<String, ToucaType>> members =
      new ArrayList<SimpleEntry<String, ToucaType>>();

  public void add(final String key, final ToucaType value) {
    members.add(new SimpleEntry<String, ToucaType>(key, value));
  }

  @Override
  public final ToucaType.Types type() {
    return ToucaType.Types.Object;
  }

  @Override
  public JsonElement json() {
    final JsonObject obj = new JsonObject();
    for (SimpleEntry<String, ToucaType> member : members) {
      obj.add(member.getKey(), member.getValue().json());
    }
    return obj;
  }
}
