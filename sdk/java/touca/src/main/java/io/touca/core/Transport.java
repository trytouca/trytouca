// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Contains logic for communicating with the Touca server.
 */
public final class Transport {
  private String apiKey;
  private String apiUrl;

  /**
   * Response of an HTTP request including status code and response body.
   */
  public static final class Response {
    public int code;
    public String content;

    Response(final int code, final String content) {
      this.code = code;
      this.content = content;
    }
  }

  private String readResponse(final InputStream inputStream)
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

  private HttpURLConnection makeConnection(final String path)
      throws IOException {
    final URL url = new URL(this.apiUrl + path);
    final HttpURLConnection con = (HttpURLConnection) url.openConnection();
    con.setRequestProperty("Accept", "application/json");
    con.setRequestProperty("Accept-Charset", "utf-8");
    con.setRequestProperty("User-Agent", "touca-client-java/1.7.1");
    con.setRequestProperty("X-Touca-API-Key", this.apiKey);
    return con;
  }

  /**
   * Attempt to authenticate with the Touca server.
   */
  public void configure(final String apiUrl, final String apiKey) {
    if (this.apiUrl == apiUrl && this.apiKey == apiKey) {
      return;
    }
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    final Response response = postRequest("/client/verify", "application/json",
        new byte[0]);
    if (response.code == HttpURLConnection.HTTP_UNAUTHORIZED) {
      throw new ToucaException("authentication failed: API key invalid");
    } else if (response.code != HttpURLConnection.HTTP_NO_CONTENT) {
      throw new ToucaException("authentication failed: invalid response");
    }
  }

  /**
   * Submits an HTTP GET request to a specific API endpoint.
   *
   * @param path API endpoint to submit HTTP request to
   * @return response received from the server
   */
  public Response getRequest(final String path) {
    try {
      final HttpURLConnection con = makeConnection(path);
      con.setRequestMethod("GET");
      return new Response(con.getResponseCode(),
          readResponse(con.getResponseCode() < 400 ? con.getInputStream() : con.getErrorStream()));
    } catch (final IOException ex) {
      throw new ToucaException(ex.getMessage());
    }
  }

  /**
   * Submits an HTTP POST request to a specific API endpoint.
   *
   * @param path        API endpoint to submit HTTP request to
   * @param contentType either "application/json" or "application/octet-stream"
   * @param content     content in bytes to submit to the endpoint
   * @param headers     headers to add to the HTTP request
   * @return response received from the server
   */
  public Response postRequest(final String path, final String contentType, final byte[] content,
      final Map<String, String> headers) {
    try {
      final HttpURLConnection con = makeConnection(path);
      con.setDoOutput(true);
      con.setRequestMethod("POST");
      con.setRequestProperty("Content-Type", contentType);
      headers.forEach((k, v) -> con.setRequestProperty(k, v));
      con.connect();
      if (content.length != 0) {
        try (OutputStream stream = con.getOutputStream()) {
          stream.write(content, 0, content.length);
        }
      }
      return new Response(con.getResponseCode(),
          readResponse(con.getResponseCode() < 400 ? con.getInputStream() : con.getErrorStream()));
    } catch (final IOException ex) {
      throw new ToucaException(ex.getMessage());
    }
  }

  public Response postRequest(final String path, final String contentType, final byte[] content) {
    return postRequest(path, contentType, content, new HashMap<>());
  }
}
