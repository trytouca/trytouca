// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.exceptions;

/**
 * Exception thrown by the SDK when we encounter unexpected issues performing
 * any of requested operations.
 */
public abstract class ToucaException extends RuntimeException {
  private static final long serialVersionUID = 1L;

  /**
   * Creates an exception with the specified message.
   *
   * @param message error message describing a possible root cause.
   */
  public ToucaException(final String message) {
    super(message);
  }
}
