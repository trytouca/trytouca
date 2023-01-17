// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

/**
 * Exception thrown by the test runner to indicate that the application should
 * exit with success status code.
 */
public class GracefulExitException extends ToucaException {
  public GracefulExitException(final String message) {
    super(message);
  }
}
