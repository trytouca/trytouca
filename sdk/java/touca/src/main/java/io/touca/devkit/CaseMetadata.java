package io.touca.devkit;

import java.time.LocalDateTime;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

public final class CaseMetadata {
  public String testCase;
  public String teamSlug;
  public String testSuite;
  public String version;
  private String builtAt;

  public CaseMetadata(final String testCase, final String teamSlug,
      final String testSuite, final String version) {
    this.testCase = testCase;
    this.teamSlug = teamSlug;
    this.testSuite = testSuite;
    this.version = version;
    this.builtAt = LocalDateTime.now().toString();
  }

  public final JsonElement json() {
    final JsonObject obj = new JsonObject();
    obj.addProperty("teamslug", teamSlug != null ? teamSlug : "unknown");
    obj.addProperty("testsuite", testSuite != null ? testSuite : "unknown");
    obj.addProperty("version", version != null ? version : "unknown");
    obj.addProperty("testcase", testCase);
    obj.addProperty("builtAt", builtAt);
    return obj;
  }
}
