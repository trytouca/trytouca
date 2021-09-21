// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.devkit;

import io.touca.types.ToucaType;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import io.touca.types.BooleanType;
import io.touca.types.NumberType;

public final class TypeHandler {
  private Map<Class<?>, Function<Object, ToucaType>> primitives =
      new HashMap<Class<?>, Function<Object, ToucaType>>() {
        {
          put(Boolean.class, x -> new BooleanType((Boolean) x));
        }
      };

  public final ToucaType transform(final Object value) {
    if (this.primitives.containsKey(value.getClass())) {
      return this.primitives.get(value.getClass()).apply(value);
    }
    return new NumberType(1);
  }

}
