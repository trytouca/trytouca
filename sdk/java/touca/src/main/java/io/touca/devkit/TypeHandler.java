// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.devkit;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import io.touca.TypeSerializer;
import io.touca.types.ArrayType;
import io.touca.types.BooleanType;
import io.touca.types.DecimalType;
import io.touca.types.IntegerType;
import io.touca.types.ObjectType;
import io.touca.types.StringType;
import io.touca.types.ToucaType;

public final class TypeHandler {
  private Map<Class<?>, Function<Object, ToucaType>> primitives;
  private Map<Class<?>, TypeSerializer<?>> customTypes;

  public TypeHandler() {
    this.primitives = new HashMap<Class<?>, Function<Object, ToucaType>>() {
      {
        put(Boolean.class, x -> new BooleanType((Boolean) x));
        put(String.class, x -> new StringType((String) x));
        put(Integer.class, x -> new IntegerType((Integer) x));
        put(Long.class, x -> new IntegerType((Long) x));
        put(Double.class, x -> new DecimalType((Double) x));
        put(Float.class, x -> new DecimalType((Float) x));
      }
    };
    this.customTypes = new HashMap<Class<?>, TypeSerializer<?>>();
  }

  public final ToucaType transform(final Object value) {
    final Class<? extends Object> clazz = value.getClass();
    if (primitives.containsKey(clazz)) {
      return primitives.get(clazz).apply(value);
    }
    if (customTypes.containsKey(clazz)) {
      // TODO: implement
      return new IntegerType(1l);
    }
    if (value instanceof Iterable) {
      final ArrayType arr = new ArrayType();
      for (Object element : (Iterable<?>) value) {
        arr.add(transform(element));
      }
      return arr;
    }
    if (value.getClass().isArray()) {
      final ArrayType arr = new ArrayType();
      for (int i = 0; i < Array.getLength(value); i++) {
        arr.add(transform(Array.get(value, i)));
      }
      return arr;
    }
    final ObjectType obj = new ObjectType();
    for (final Field field : clazz.getFields()) {
      try {
        obj.add(field.getName(), this.transform(field.get(value)));
      } catch (final IllegalAccessException ex) {
        // TODO: implement
      }
    }
    return obj;
  }

  public <T> void addSerializer(final Class<T> clazz,
      final Function<T, ? extends Object> serializer) {
    // customTypes.put(clazz, serializer);
  }

}
