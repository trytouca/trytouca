// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.exceptions;

/**
 * This exception is raised if we encounter any error when configuring the Touca
 * SDK.
 */
public final class StateException extends ToucaException {
  private static final long serialVersionUID = 1L;

  /**
   * Creates an exception with the specified message.
   *
   * @param message error message describing a possible root cause.
   */
  public StateException(final String message) {
    super(message);
  }
}
