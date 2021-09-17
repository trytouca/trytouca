// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrowsExactly;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public final class OptionsTest {

    @Test
    public void passWithEmptyOptions() {
        Options options = new Options();
        options.update(new Options());
        assertTrue(options.concurrency);
    }

    @Test
    public void failWhenFileIsMissing() {
        Options existing = new Options();
        Options incoming = new Options();
        incoming.file = "some/path";
        Exception ex = assertThrowsExactly(ConfigurationException.class, () -> {
            existing.update(incoming);
        });
        assertEquals("config file not found", ex.getMessage());
    }

    @Test
    public void failWhenDirectoryIsPassedAsFile(@TempDir Path tempDir) {
        Options existing = new Options();
        Options incoming = new Options();
        incoming.file = tempDir.toString();
        Exception ex = assertThrowsExactly(ConfigurationException.class, () -> {
            existing.update(incoming);
        });
        assertEquals("config file not found", ex.getMessage());
    }

    @Test
    public void failWhenFileIsNotJson(@TempDir Path tempDir) throws IOException {
        Path configFile = tempDir.resolve("config.json");
        Files.write(configFile, "content".getBytes(StandardCharsets.UTF_8));
        Options existing = new Options();
        Options incoming = new Options();
        incoming.file = configFile.toString();
        Exception ex = assertThrowsExactly(ConfigurationException.class, () -> {
            existing.update(incoming);
        });
        assertEquals("failed to parse config file", ex.getMessage());
    }

    @Test
    public void passWhenFileIsEmptyJson(@TempDir Path tempDir) throws IOException {
        Path configFile = tempDir.resolve("config.json");
        Files.write(configFile, "{\"key\": \"value\"}".getBytes(StandardCharsets.UTF_8));
        Options existing = new Options();
        Options incoming = new Options();
        incoming.file = configFile.toString();
        assertDoesNotThrow(() -> {
            existing.update(incoming);
        });
    }

    @Test
    public void failWhenParamsHaveUnexpectedTypes(@TempDir Path tempDir) throws IOException {
        Path configFile = tempDir.resolve("config.json");
        Files.write(configFile, "{\"touca\": {\"offline\": \"some-string\"}}".getBytes(StandardCharsets.UTF_8));
        Options existing = new Options();
        Options incoming = new Options();
        incoming.file = configFile.toString();
        Exception ex = assertThrowsExactly(ConfigurationException.class, () -> {
            existing.update(incoming);
        });
        assertEquals("failed to parse config file", ex.getMessage());
    }

    @Test
    public void passWhenParamsAreExpected(@TempDir Path tempDir) throws IOException {
        Path configFile = tempDir.resolve("config.json");
        String content = "{\"touca\": {\"team\": \"some-team\", \"suite\": \"some-suite\", \"version\": \"some-version\", \"concurrency\": true}}";
        Files.write(configFile, content.getBytes(StandardCharsets.UTF_8));
        Options existing = new Options();
        Options incoming = new Options();
        incoming.file = configFile.toString();
        assertDoesNotThrow(() -> {
            existing.update(incoming);
        });
        assertEquals("some-team", existing.team);
        assertEquals("some-suite", existing.suite);
        assertEquals("some-version", existing.version);
        assertTrue(existing.concurrency);
    }

    @Test
    public void checkDefaultProtocol() {
        Options existing = new Options();
        Options incoming = new Options();
        incoming.apiKey = "some-key";
        incoming.apiUrl = "api.touca.io";
        incoming.team = "some-team";
        incoming.suite = "some-suite";
        incoming.version = "some-version";
        assertDoesNotThrow(() -> {
            existing.update(incoming);
        });
        assertEquals("https://api.touca.io/", existing.apiUrl);
        assertEquals("some-team", existing.team);
        assertEquals("some-suite", existing.suite);
        assertEquals("some-version", existing.version);
    }

    @Test
    public void checkLongFormatUrl() {
        Options existing = new Options();
        Options incoming = new Options();
        incoming.apiKey = "some-key";
        incoming.apiUrl = "http://localhost:8081//v2//@/team//suite/version/";
        assertDoesNotThrow(() -> {
            existing.update(incoming);
        });
        assertEquals("http://localhost:8081/v2", existing.apiUrl);
        assertEquals("team", existing.team);
        assertEquals("suite", existing.suite);
        assertEquals("version", existing.version);
    }

    @Test
    public void checkShortFormatUrl() {
        Options existing = new Options();
        Options incoming = new Options();
        incoming.apiKey = "some-key";
        incoming.apiUrl = "http://127.0.0.1/api";
        Exception ex = assertThrowsExactly(ConfigurationException.class, () -> {
            existing.update(incoming);
        });
        assertEquals("missing required options: suite, team, version", ex.getMessage());
        assertEquals("some-key", existing.apiKey);
        assertEquals("http://127.0.0.1/api", existing.apiUrl);
    }

    @Test
    public void failConflictingInput() {
        Options existing = new Options();
        Options incoming = new Options();
        incoming.apiKey = "some-key";
        incoming.apiUrl = "http://localhost:8081/@/team/suite/version";
        incoming.suite = "some-other-version";
        Exception ex = assertThrowsExactly(ConfigurationException.class, () -> {
            existing.update(incoming);
        });
        assertEquals("option \"suite\" is in conflict with provided api url", ex.getMessage());
        assertEquals("http://localhost:8081/", existing.apiUrl);
    }
}
