// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

/**
 * Interface to be implemented by consumers to customize the serialization of a
 * given type.
 */
public interface TypeAdapter<T> {

  /**
   * Called prior to serialization when the field of the specified type is
   * encountered.
   *
   * @param src the object to be converted
   * @return any converted object
   */
  Object adapt(final T src);

}
