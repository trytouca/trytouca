// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import io.touca.exceptions.ConfigException;
import io.touca.exceptions.ServerException;

/**
 * Contains logic for communicating with the Touca server.
 */
public final class Transport {
  private Options options;
  private String token;

  /**
   *
   */
  private static final class Response {
    public int code;
    public String content;

    Response(final int code, final String content) {
      this.code = code;
      this.content = content;
    }
  }

  /**
   * Creates an instance of this class, without setting any configuration
   * option.
   */
  public Transport() {
    this.options = new Options();
  }

  /**
   * Reports whether we are already authenticated with the Touca server.
   * 
   * @return true if we are authenticated with the Touca server.
   */
  public boolean hasToken() {
    return !this.token.isEmpty();
  }

  /**
   * Applies configuration options of a given instance to this instance.
   *
   * @param incoming configuration options to apply to this instance
   */
  public void update(final Options incoming) {
    final Map<String, String> fresh = options.diff(incoming);
    if (fresh.isEmpty()) {
      return;
    }
    options.mergeMap(fresh);
    if (fresh.containsKey("apiUrl")) {
      handshake();
      token = null;
      if (fresh.containsKey("apiKey")) {
        authenticate();
      }
    }
  }


  /**
   *
   */
  private void handshake() {
    final Response response = getRequest("/platform");
    if (response.code != 200) {
      throw new ServerException("could not communicate with server");
    }
    final JsonElement element = JsonParser.parseString(response.content);
    final JsonObject object = element.getAsJsonObject();
    if (!object.get("ready").getAsBoolean()) {
      throw new ServerException("touca server is not ready");
    }
  }


  /**
   *
   */
  private final String readResponse(final InputStream inputStream)
      throws IOException {
    final StringBuilder builder = new StringBuilder();
    try (BufferedReader reader = new BufferedReader(
        new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
      for (String line; (line = reader.readLine()) != null;) {
        builder.append(line);
      }
    }
    return builder.toString();
  }

  /**
   *
   */
  private final HttpURLConnection makeConnection(final String path)
      throws IOException {
    final URL url = new URL(options.apiUrl + path);
    final HttpURLConnection con = (HttpURLConnection) url.openConnection();
    con.setRequestProperty("Accept", "application/json");
    con.setRequestProperty("Accept-Charset", "utf-8");
    con.setRequestProperty("User-Agent",
        String.format("touca-client-java/%s", "0.2.1"));
    if (token != null) {
      con.setRequestProperty("Authorization",
          String.format("Bearer %s", token));
    }
    return con;
  }

  /**
   *
   */
  private final Response getRequest(final String path) {
    try {
      final HttpURLConnection con = makeConnection(path);
      con.setRequestMethod("GET");
      return new Response(con.getResponseCode(),
          readResponse(con.getInputStream()));
    } catch (final IOException ex) {
      throw new ServerException(ex.getMessage());
    }
  }

  /**
   *
   */
  private final Response postRequest(final String path,
      final String contentType, final byte[] content) {
    try {
      final HttpURLConnection con = makeConnection(path);
      con.setDoOutput(true);
      con.setRequestMethod("POST");
      con.setRequestProperty("Content-Type", contentType);
      con.connect();
      if (content.length != 0) {
        try (OutputStream os = con.getOutputStream()) {
          os.write(content, 0, content.length);
        }
      }
      return new Response(con.getResponseCode(),
          readResponse(con.getInputStream()));
    } catch (final IOException ex) {
      throw new ServerException(ex.getMessage());
    }
  }

  /**
   *
   */
  public void authenticate() {
    if (this.token != null) {
      return;
    }
    if (options.apiUrl == null || options.apiUrl.isEmpty()) {
      throw new ConfigException("invalid api key");
    }
    final String content = String.format("{\"key\":\"%s\"}", options.apiKey);
    final Response response = postRequest("/client/signin", "application/json",
        content.getBytes(StandardCharsets.UTF_8));
    if (response.code == 401) {
      throw new ServerException("authentication failed: API key invalid");
    } else if (response.code != 200) {
      throw new ServerException("authentication failed: invalid response");
    }
    final JsonElement element = JsonParser.parseString(response.content);
    final JsonObject object = element.getAsJsonObject();
    this.token = object.get("token").getAsString();
  }

  /**
   * Queries the Touca server for the list of test cases submitted for the
   * baseline version of this suite.
   * 
   * @return list of test cases for this suite.
   */
  public List<String> getTestcases() {
    final Response response = getRequest(
        String.format("/element/%s/%s", options.team, options.suite));
    if (response.code != 200) {
      throw new ServerException("failed to obtain list of test cases");
    }
    final JsonElement content = JsonParser.parseString(response.content);
    final JsonArray array = content.getAsJsonArray();
    final List<String> elements = new ArrayList<String>();
    for (int i = 0; i < array.size(); i++) {
      final JsonObject element = array.get(i).getAsJsonObject();
      elements.add(element.get("name").getAsString());
    }
    return elements;
  }

  /**
   * Submits given binary data to the Touca server.
   *
   * @param content serialized binary representation of one or more test cases.
   */
  public void post(final byte[] content) {
    final Response response =
        postRequest("/client/submit", "application/octet-stream", content);
    if (response.code != 204) {
      throw new ServerException("failed to submit test results");
    }
  }

  /**
   * Notifies the Touca server that all test cases were executed for this
   * version and no further test result is expected to be submitted.
   */
  public void seal() {
    final String path = String.format("/batch/%s/%s/%s/seal2", options.team,
        options.suite, options.version);
    final Response response =
        postRequest(path, "application/json", new byte[0]);
    if (response.code != 204) {
      throw new ServerException("failed to seal this version");
    }
  }

}
