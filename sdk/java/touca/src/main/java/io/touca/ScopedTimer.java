// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

public final class ScopedTimer implements AutoCloseable {
  private final String key;
  private boolean closed = false;

  public ScopedTimer(final String key) {
    this.key = key;
    Touca.startTimer(key);
  }

  @Override
  public void close() {
    if (!this.closed) {
      Touca.stopTimer(key);
    }
  }
}
