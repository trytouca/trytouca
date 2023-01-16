// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrowsExactly;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.touca.core.ClientOptions;
import io.touca.exceptions.ConfigException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

public final class OptionsTest {

  @Test
  void checkToMap() {
    final ClientOptions options = new ClientOptions(x -> {
      x.apiKey = "some-key";
      x.team = "some-team";
      x.suite = "some-suite";
      x.offline = true;
    });
    assertTrue(new ClientOptions().entrySet().isEmpty());
    Map<String, String> m = options.entrySet();
    assertEquals(4, m.size());
    assertEquals("some-key", m.get("apiKey"));
    assertEquals("some-team", m.get("team"));
    assertEquals("some-suite", m.get("suite"));
    assertEquals("true", m.get("offline"));
  }

  @Test
  void checkDiffBasics() {
    final ClientOptions options = new ClientOptions(x -> {
      x.apiKey = "some-key";
      x.team = "some-team";
      x.suite = "some-suite";
      x.offline = true;
    });
    assertTrue(new ClientOptions().diff(new ClientOptions()).isEmpty());
    assertTrue(options.diff(options).isEmpty());
    final Map<String, String> m = new ClientOptions().diff(options);
    assertEquals(4, m.size());
    assertEquals("some-key", m.get("apiKey"));
    assertEquals("some-team", m.get("team"));
    assertEquals("some-suite", m.get("suite"));
    assertEquals("true", m.get("offline"));
  }

  @Test
  void checkDiffCommon() {
    final ClientOptions existing = new ClientOptions(x -> {
      x.apiKey = "some-key";
      x.apiUrl = "some-url";
      x.suite = "some-suite";
    });
    final ClientOptions incoming = new ClientOptions(x -> {
      x.apiKey = "some-key";
      x.apiUrl = "some-other-url";
      x.team = "some-team";
    });
    final Map<String, String> m = existing.diff(incoming);
    assertEquals(2, m.size());
    assertTrue(m.containsKey("apiUrl"));
    assertTrue(m.containsKey("team"));
    assertEquals("some-other-url", m.get("apiUrl"));
    assertEquals("some-team", m.get("team"));
  }

  @Test
  void passWithEmptyOptions() {
    ClientOptions existing = new ClientOptions();
    existing.apply(new ClientOptions());
    assertTrue(existing.concurrency);
  }

  @Test
  void failWhenFileIsMissing() {
    ClientOptions existing = new ClientOptions();
    ClientOptions incoming = new ClientOptions(opts -> {
      opts.file = "some/path";
    });
    Exception ex = assertThrowsExactly(ConfigException.class, () -> {
      existing.apply(incoming);
    });
    assertEquals("config file not found", ex.getMessage());
  }

  @Test
  void failWhenDirectoryIsPassedAsFile(@TempDir Path tempDir) {
    ClientOptions existing = new ClientOptions();
    ClientOptions incoming = new ClientOptions(opts -> {
      opts.file = tempDir.toString();
    });
    Exception ex = assertThrowsExactly(ConfigException.class, () -> {
      existing.apply(incoming);
    });
    assertEquals("config file not found", ex.getMessage());
  }

  @Test
  void failWhenFileIsNotJson(@TempDir Path tempDir) throws IOException {
    Path configFile = tempDir.resolve("config.json");
    Files.write(configFile, "content".getBytes(StandardCharsets.UTF_8));
    ClientOptions existing = new ClientOptions();
    ClientOptions incoming = new ClientOptions(opts -> {
      opts.file = configFile.toString();
    });
    Exception ex = assertThrowsExactly(ConfigException.class, () -> {
      existing.apply(incoming);
    });
    assertEquals("failed to parse config file", ex.getMessage());
  }

  @Test
  void passWhenFileIsEmptyJson(@TempDir Path tempDir) throws IOException {
    Path configFile = tempDir.resolve("config.json");
    Files.write(configFile,
        "{\"key\": \"value\"}".getBytes(StandardCharsets.UTF_8));
    ClientOptions existing = new ClientOptions();
    ClientOptions incoming = new ClientOptions(opts -> {
      opts.file = configFile.toString();
    });
    assertDoesNotThrow(() -> {
      existing.apply(incoming);
    });
  }

  @Test
  void failWhenParamsHaveUnexpectedTypes(@TempDir Path tempDir)
      throws IOException {
    Path configFile = tempDir.resolve("config.json");
    Files.write(configFile, "{\"touca\": {\"offline\": \"some-string\"}}"
        .getBytes(StandardCharsets.UTF_8));
    ClientOptions existing = new ClientOptions();
    ClientOptions incoming = new ClientOptions(opts -> {
      opts.file = configFile.toString();
    });
    incoming.file = configFile.toString();
    Exception ex = assertThrowsExactly(ConfigException.class, () -> {
      existing.apply(incoming);
    });
    assertEquals("failed to parse config file", ex.getMessage());
  }

  @Test
  void passWhenParamsAreExpected(@TempDir Path tempDir) throws IOException {
    Path configFile = tempDir.resolve("config.json");
    String content = "{\"touca\": {\"team\": \"some-team\", \"suite\": \"some-suite\", \"version\": \"some-version\", \"concurrency\": true}}";
    Files.write(configFile, content.getBytes(StandardCharsets.UTF_8));
    ClientOptions existing = new ClientOptions();
    ClientOptions incoming = new ClientOptions(opts -> {
      opts.file = configFile.toString();
    });
    assertDoesNotThrow(() -> {
      existing.apply(incoming);
    });
    assertEquals("some-team", existing.team);
    assertEquals("some-suite", existing.suite);
    assertEquals("some-version", existing.version);
    assertTrue(existing.concurrency);
  }

  @Test
  void checkDefaultProtocol() {
    ClientOptions existing = new ClientOptions();
    ClientOptions incoming = new ClientOptions(opts -> {
      opts.apiKey = "some-key";
      opts.apiUrl = "api.touca.io";
      opts.team = "some-team";
      opts.suite = "some-suite";
      opts.version = "some-version";
    });
    assertDoesNotThrow(() -> {
      existing.apply(incoming);
    });
    assertEquals("https://api.touca.io", existing.apiUrl);
    assertEquals("some-team", existing.team);
    assertEquals("some-suite", existing.suite);
    assertEquals("some-version", existing.version);
  }

  @Test
  void checkLongFormatUrl() {
    ClientOptions existing = new ClientOptions();
    ClientOptions incoming = new ClientOptions(opts -> {
      opts.apiKey = "some-key";
      opts.apiUrl = "http://localhost:8080//v2//@/team//suite/version/";
    });
    assertDoesNotThrow(() -> {
      existing.apply(incoming);
    });
    assertEquals("http://localhost:8080/v2", existing.apiUrl);
    assertEquals("team", existing.team);
    assertEquals("suite", existing.suite);
    assertEquals("version", existing.version);
  }

  @Test
  void checkShortFormatUrl() {
    ClientOptions existing = new ClientOptions();
    ClientOptions incoming = new ClientOptions(opts -> {
      opts.apiKey = "some-key";
      opts.apiUrl = "http://127.0.0.1/api";
    });
    Exception ex = assertThrowsExactly(ConfigException.class, () -> {
      existing.apply(incoming);
    });
    assertEquals("missing required options: suite, team, version",
        ex.getMessage());
    assertEquals("some-key", existing.apiKey);
    assertEquals("http://127.0.0.1/api", existing.apiUrl);
  }

  @Test
  void failConflictingInput() {
    ClientOptions existing = new ClientOptions();
    ClientOptions incoming = new ClientOptions(opts -> {
      opts.apiKey = "some-key";
      opts.apiUrl = "http://localhost:8080/@/team/suite/version";
      opts.suite = "some-other-version";
    });
    Exception ex = assertThrowsExactly(ConfigException.class, () -> {
      existing.apply(incoming);
    });
    assertEquals("option \"suite\" is in conflict with provided api url",
        ex.getMessage());
    assertEquals("http://localhost:8080", existing.apiUrl);
  }
}
