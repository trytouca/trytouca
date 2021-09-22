// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import io.touca.devkit.Client;

public final class ClientTest {

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
    assertNull(client.configurationError());
  }

  @Test
  public void saveJsonWithoutConfigure(@TempDir Path tempDir)
      throws IOException {
    Path outputFile = tempDir.resolve("some-file");
    Client client = new Client();
    client.declareTestcase("some-case");
    client.perform(
        x -> x.addResult("some-result", client.transform("some-value")));
    client.perform(x -> x.addAssertion("some-assertion",
        client.transform("some-other-value")));
    client.perform(x -> x.addMetric("some-metric", 10l));
    assertDoesNotThrow(() -> {
      client.saveJson(outputFile, new HashSet<String>());
    });
    final byte[] encoded = Files.readAllBytes(outputFile);
    final String content = new String(encoded, StandardCharsets.UTF_8);
    assertEquals("[]", content);
  }

  @Test
  public void saveJsonWithConfigure(@TempDir Path tempDir) throws IOException {
    Path outputFile = tempDir.resolve("some-file");
    Client client = new Client();
    client.configure(x -> {
    });
    client.declareTestcase("some-case");
    client.perform(
        x -> x.addResult("some-result", client.transform("some-value")));
    client.perform(x -> x.addAssertion("some-assertion",
        client.transform("some-other-value")));
    client.perform(x -> x.addMetric("some-metric", 10l));
    assertDoesNotThrow(() -> {
      client.saveJson(outputFile, new HashSet<String>());
    });
    final byte[] encoded = Files.readAllBytes(outputFile);
    final String content = new String(encoded, StandardCharsets.UTF_8);
    assertTrue(content.contains(
        "{\"metadata\":{\"teamslug\":\"unknown\",\"testsuite\":\"unknown\",\"version\":\"unknown\",\"testcase\":\"some-case\",\"builtAt\":"));
    assertTrue(content.contains(
        "\"results\":[{\"key\":\"some-result\",\"value\":\"some-value\"}]"));
    assertTrue(content.contains(
        "\"assertions\":[{\"key\":\"some-assertion\",\"value\":\"some-other-value\"}]"));
    assertTrue(content
        .contains("\"metrics\":[{\"key\":\"some-metric\",\"value\":10}]"));
  }
}
