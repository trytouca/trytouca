// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

public abstract class ToucaType {

  public enum Types {
    Boolean, Number, String, Array, Object, Unknown
  }

  public abstract ToucaType.Types type();
}
