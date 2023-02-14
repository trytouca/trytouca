// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.core;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

/** Utility classes for submission of test results to the Touca server. */
public class Post {
  /** Indicates the comparison status of submitted test results. */
  public static enum Status {
    Sent, Skip, Fail, Pass, Diff
  }

  /** Options used to determine how to submit test results. */
  public static class Options {
    Boolean submitAsync = false;
  }

  static Status parseResponse(final String content) {
    final Gson gson = new GsonBuilder().create();
    final JsonArray jsonArray = gson.fromJson(content, JsonArray.class);
    final JsonObject result = jsonArray.get(0).getAsJsonObject();
    final String src = result.get("body").getAsJsonObject().get("src")
        .getAsJsonObject().get("version").getAsString();
    final String dst = result.get("body").getAsJsonObject().get("dst")
        .getAsJsonObject().get("version").getAsString();
    final Double score = result.get("overview").getAsJsonObject().get("keysScore").getAsDouble();
    return src.equals(dst) ? Status.Sent : score == 1.0 ? Status.Pass : Status.Diff;
  }

  static String parseError(final String content) {
    final Gson gson = new GsonBuilder().create();
    final JsonObject jsonObject = gson.fromJson(content, JsonObject.class);
    final JsonArray errors = jsonObject.get("errors").getAsJsonArray();
    final String error = errors.get(0).getAsString();
    return error.equals("batch is seal") ? " This version is already submitted and sealed."
        : error.equals("team not found") ? " This team does not exist." : error;
  }
}
