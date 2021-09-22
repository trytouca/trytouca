// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.List;
import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import io.touca.schema.Schema;

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

  @Override
  public int serialize(final FlatBufferBuilder builder) {
    final int fbsName = builder.createString("some-name");
    final List<Integer> membersOffsets = new ArrayList<Integer>();
    for (final SimpleEntry<String, ToucaType> entry : this.members) {
      final int memberKey = builder.createString(entry.getKey());
      final int memberValue = entry.getValue().serialize(builder);
      Schema.TObjectMember.startTObjectMember(builder);
      Schema.TObjectMember.addName(builder, memberKey);
      Schema.TObjectMember.addValue(builder, memberValue);
      membersOffsets.add(Schema.TObjectMember.endTObjectMember(builder));
    }
    final int fbsMembers = Schema.TObject.createValuesVector(builder,
        membersOffsets.stream().mapToInt(x -> x).toArray());
    Schema.TObject.startTObject(builder);
    Schema.TObject.addKey(builder, fbsName);
    Schema.TObject.addValues(builder, fbsMembers);
    final int fbsValue = Schema.TObject.endTObject(builder);
    Schema.TypeWrapper.startTypeWrapper(builder);
    Schema.TypeWrapper.addValue(builder, fbsValue);
    Schema.TypeWrapper.addValueType(builder, Schema.TType.TObject);
    return Schema.TypeWrapper.endTypeWrapper(builder);
  }
}
