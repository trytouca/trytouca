// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.devkit;

import io.touca.types.ToucaType;

public final class ResultEntry {
  public enum ResultCategory {
    Check, Assert
  }

  public ToucaType value;
  public ResultCategory type;

  public ResultEntry(final ToucaType value, ResultCategory type) {
    this.value = value;
    this.type = type;
  }
}
