// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.exceptions;

/**
 * This exception is raised when Touca Server fails to respond or respond in an
 * unexpected way to a given operation.
 */
public final class ServerException extends ToucaException {
  private static final long serialVersionUID = 1L;

  /**
   * Creates an exception with the specified message.
   *
   * @param message error message describing a possible root cause.
   */
  public ServerException(final String message) {
    super(message);
  }
}
