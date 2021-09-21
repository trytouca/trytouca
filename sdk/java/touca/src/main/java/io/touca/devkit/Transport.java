package io.touca.devkit;

import java.util.Arrays;
import java.util.Map;

public final class Transport {
  private Options options;
  private String token;

  public Transport() {
    this.options = new Options();
  }

  public Iterable<String> getTestcases() {
    return Arrays.asList(new String[0]);
  }

  public boolean post(byte[] content) {
    return false;
  }

  public boolean seal() {
    return false;
  }

  public boolean hasToken() {
    return this.token != null;
  }

  public void update(final Options options) {
    final Map<String, String> fresh = this.options.diff(options);
    if (fresh.isEmpty()) {
      return;
    }
    if (fresh.containsKey("apiKey") || fresh.containsKey("apiUrl")) {
      this.token = null;
      // handshake();
    }
    // this.options.merge(fresh);
  }
}
