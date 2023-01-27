// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

/**
 * Exception thrown by the SDK when we encounter unexpected issues performing
 * any of requested operations.
 */
public class ToucaException extends RuntimeException {
  private static final long serialVersionUID = 1L;

  /**
   * Creates an exception with the specified message.
   *
   * @param message error message describing a possible root cause.
   */
  public ToucaException(final String message, final Object... args) {
    super(String.format(message, args));
  }

  /** For use by derived classes. */
  protected ToucaException(final String message) {
    super(message);
  }
}
