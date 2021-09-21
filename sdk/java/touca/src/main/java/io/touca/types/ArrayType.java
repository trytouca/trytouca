// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.types;

import java.util.List;

public final class ArrayType extends ToucaType {
  private List<ToucaType> values;

  public void add(final ToucaType value) {
    values.add(value);
  }

  @Override
  public final ToucaType.Types type() {
    return ToucaType.Types.Array;
  }
}
