// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import io.touca.types.ObjectType;

/**
 * Interface to be implemented by consumers to customize the serialization of a
 * given type.
 * 
 * @param <T> type for which the serializer is being registered.
 */
public interface TypeSerializer<T extends Object> {

  /**
   * Called during serialization when the a field of the specified type is
   * encountered.
   * 
   * @param src the object to be serialized
   * @return a generic ObjectType corresponding with the given object
   */
  public abstract ObjectType serialize(final T src);

}
