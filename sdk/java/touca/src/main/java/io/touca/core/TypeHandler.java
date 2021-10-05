// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.HashMap;
import java.util.Map;
import java.util.Iterator;
import java.util.AbstractMap.SimpleEntry;
import java.util.function.Function;

import io.touca.TypeAdapter;
import io.touca.TypeAdapterContext;

public final class TypeHandler {
  private Map<Class<?>, Function<Object, ToucaType>> primitives;
  private Map<Class<?>, TypeAdapter<? super Object>> adapters;

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
    this.adapters = new HashMap<Class<?>, TypeAdapter<? super Object>>();
  }

  public final ToucaType transform(final Object value) {
    if (value instanceof ToucaType) {
      return (ToucaType) value;
    }
    if (value instanceof TypeAdapterContext) {
      final Iterator<SimpleEntry<String, Object>> iterator =
          ((TypeAdapterContext) value).iterator();
      final ObjectType obj = new ObjectType();
      while (iterator.hasNext()) {
        final SimpleEntry<String, Object> entry = iterator.next();
        obj.add(entry.getKey(), transform(entry.getValue()));
      }
      return obj;
    }
    final Class<? extends Object> clazz = value.getClass();
    if (primitives.containsKey(clazz)) {
      return primitives.get(clazz).apply(value);
    }
    if (adapters.containsKey(clazz)) {
      return transform(adapters.get(clazz).adapt(value));
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
    return reflect(clazz, value);
  }

  private ObjectType reflect(final Class<?> clazz, final Object value) {
    final ObjectType obj = new ObjectType();
    for (final Field field : clazz.getDeclaredFields()) {
      try {
        if (Modifier.isStatic(field.getModifiers())) {
          continue;
        }
        obj.add(field.getName(), this.transform(field.get(value)));
      } catch (final IllegalAccessException ex) {
        // TODO: what should we do on failure
      }
    }
    return obj;
  }

  @SuppressWarnings("unchecked")
  public <T> void addTypeAdapter(final Class<T> clazz,
      final TypeAdapter<T> adapter) {
    adapters.put(clazz, (TypeAdapter<? super Object>) adapter);
  }

}
