// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import io.touca.devkit.Client;

public class ClientTest {

  @Test
  public void checkEmptyConfigure() {
    Client client = new Client();
    assertFalse(client.isConfigured());
    assertNull(client.configurationError());
    client.configure((options) -> {
    });
    assertTrue(client.isConfigured());
    assertNull(client.configurationError());
  }

  @Test
  public void checkBasicConfigure() {
    Client client = new Client();
    assertFalse(client.isConfigured());
    assertNull(client.configurationError());
    assertDoesNotThrow(() -> {
      client.configure(options -> {
        options.concurrency = true;
        options.apiKey = "some-key";
        options.apiUrl = "https://api.touca.io/@/team/suite/v1";
        options.offline = true;
      });
    });
    assertTrue(client.isConfigured());
    assertEquals(null, client.configurationError());
  }
}
