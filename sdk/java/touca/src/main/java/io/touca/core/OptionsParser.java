// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

public final class OptionsParser {
  private OptionsParser() {
  }

  /**
   * Performs handshake with the server and validates API Key if configured to do
   * so.
   *
   * @param options   application configuration options
   * @param transport transport for making http requests
   */
  private static void authenticate(final ClientOptions options, final Transport transport) {
    if (options.offline != null && options.apiKey != null && options.apiUrl != null
        && !options.offline && !options.apiKey.isEmpty() && !options.apiUrl.isEmpty()) {
      transport.configure(options.apiUrl, options.apiKey);
    }
  }

  public static void updateCoreOptions(final ClientOptions options, final Transport transport) {
    OptionsParser.authenticate(options, transport);
  }
}
