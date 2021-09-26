// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import io.touca.core.Client;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

public final class ClientTest {

  public static final class CustomDate {
    public final int year;
    public final int month;
    public final int day;

    public CustomDate(final int year, final int month, final int day) {
      this.year = year;
      this.month = month;
      this.day = day;
    }
  }

  private Client makeClient() {
    final Client client = new Client();
    final String[] courses = {"math", "english"};
    final List<String> parents = new ArrayList<String>() {
      {
        add("Lily");
        add("James");
      }
    };
    client.configure(x -> {
      x.team = "some-team";
      x.suite = "some-suite";
      x.version = "some-version";
    });
    client.declareTestcase("some-case");
    client.perform(x -> {
      x.addAssertion("username", client.transform("potter"));
      x.addResult("is_famous", client.transform(true));
      x.addResult("tall", client.transform(6.1));
      x.addResult("age", client.transform(21));
      x.addResult("name", client.transform("harry"));
      x.addResult("dob", client.transform(new CustomDate(2000, 1, 1)));
      x.addResult("parents", client.transform(parents));
      x.addResult("courses", client.transform(courses));
      for (final String course : courses) {
        x.addArrayElement("course-names", client.transform(course));
        x.addHitCount("course-count");
      }
      x.addMetric("exam_time", 42L);
      x.startTimer("small_time");
      try {
        Thread.sleep(10);
      } catch (final InterruptedException ex) {
        fail(ex.getMessage());
      }
      x.stopTimer("small_time");
    });
    return client;
  }

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

  @Test
  public void checkResultsInJson(@TempDir Path tempDir) throws IOException {
    Path outputFile = tempDir.resolve("some-file");
    Client client = makeClient();
    assertDoesNotThrow(() -> {
      client.saveJson(outputFile, new HashSet<String>() {
        {
          add("some-case");
        }
      });
    });
    final byte[] encoded = Files.readAllBytes(outputFile);
    final String content = new String(encoded, StandardCharsets.UTF_8);
    assertTrue(content.contains("{\"key\":\"is_famous\",\"value\":true}"));
    assertTrue(content.contains("{\"key\":\"tall\",\"value\":6.1}"));
    assertTrue(content.contains("{\"key\":\"age\",\"value\":21}"));
    assertTrue(content.contains("{\"key\":\"name\",\"value\":\"harry\"}"));
    assertTrue(content.contains(
        "{\"key\":\"dob\",\"value\":{\"year\":2000,\"month\":1,\"day\":1}}"));
    assertTrue(content
        .contains("{\"key\":\"parents\",\"value\":[\"Lily\",\"James\"]}"));
    assertTrue(content
        .contains("{\"key\":\"courses\",\"value\":[\"math\",\"english\"]}"));
    assertTrue(content.contains(
        "{\"key\":\"course-names\",\"value\":[\"math\",\"english\"]}"));
    assertTrue(content.contains("{\"key\":\"course-count\",\"value\":2}"));
  }

  @Test
  public void saveBinary(@TempDir Path tempDir) throws IOException {
    Path outputFile = tempDir.resolve("some-file");
    Client client = makeClient();
    assertDoesNotThrow(() -> {
      client.saveBinary(outputFile, new HashSet<String>());
    });
    final byte[] encoded = Files.readAllBytes(outputFile);
    final String content = new String(encoded, StandardCharsets.UTF_8);
    assertTrue(!content.isEmpty());
  }
}
