// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.rules;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;

/**
 * Comparison rule for a given data point, letting you approve of differences
 * that based on your specified criteria.
 */
public abstract class ComparisonRule {

  public abstract JsonElement json();

  public abstract int serialize(final FlatBufferBuilder builder);
}
