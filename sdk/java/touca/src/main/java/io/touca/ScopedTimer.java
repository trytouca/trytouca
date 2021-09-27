// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

/**
 * Utility class to measure runtime of a given piece of code.
 *
 * Implements `AutoCloseable` to be used in a `try-with-resources` statement:
 *
 * <pre>
 * {@code
 *   try (ScopedTimer timer = new ScopedTimer("yourCode")) {
 *     yourCode();
 *   }
 * }
 * </pre>
 */
public final class ScopedTimer implements AutoCloseable {
  private final String key;
  private boolean closed = false;

  /**
   * Creates an instance that automatically starts runtime measurement.
   *
   * @param key name to be associated with the measurement
   */
  public ScopedTimer(final String key) {
    this.key = key;
    Touca.startTimer(key);
  }

  /**
   * Stops runtime measurement.
   */
  @Override
  public void close() {
    if (!this.closed) {
      Touca.stopTimer(key);
    }
  }
}
