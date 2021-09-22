// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;

public abstract class ToucaType {

  public enum Types {
    Boolean, Number, String, Array, Object, Unknown
  }

  public abstract ToucaType.Types type();

  public abstract JsonElement json();

  public abstract int serialize(final FlatBufferBuilder builder);
}
