// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.rules;

import com.google.flatbuffers.FlatBufferBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import io.touca.core.Schema;
import java.util.Optional;
import java.util.function.Consumer;

/**
 * Comparison rule for a decimal data point, letting you approve of differences
 * that based on your specified criteria.
 */
public class DecimalRule extends ComparisonRule {

  private static enum Mode {
    Absolute, Relative
  }

  private Mode mode;
  private Optional<Double> min;
  private Optional<Double> max;
  private Optional<Boolean> percent;

  private DecimalRule(
      final Mode mode,
      final Optional<Double> min,
      final Optional<Double> max,
      final Optional<Boolean> percent) {
    this.mode = mode;
    this.min = min;
    this.max = max;
    this.percent = percent;
  }

  /**
   * Options that user can set when calling
   * {@link DecimalRule#absolute(Consumer)}.
   */
  public static final class AbsoluteOptions {
    Optional<Double> min = Optional.empty();
    Optional<Double> max = Optional.empty();

    public void setMin(final double value) {
      this.min = Optional.of(value);
    }

    public void setMax(final double value) {
      this.max = Optional.of(value);
    }
  }

  /**
   * Options that user can set when calling
   * {@link DecimalRule#relative(Consumer)}.
   */
  public static final class RelativeOptions {
    Optional<Double> min = Optional.empty();
    Optional<Boolean> percent = Optional.empty();

    public void setMin(final double value) {
      this.min = Optional.of(value);
    }

    public void setPercent() {
      this.percent = Optional.of(true);
    }
  }

  /**
   * Creates a custom comparison rule for a decimal data point, letting you
   * approve of any differences in this data point based on its absolute value.
   *
   * @param properties properties of this comparison rule
   * @return comparison rule to pass to data capturing functions
   */
  public static DecimalRule absolute(final Consumer<AbsoluteOptions> properties) {
    AbsoluteOptions opts = new AbsoluteOptions();
    properties.accept(opts);
    return new DecimalRule(Mode.Absolute, opts.min, opts.max, Optional.empty());
  }

  /**
   * Creates a custom comparison rule for a decimal data point, letting you
   * approve of any differences in this data point based on the value of
   * difference.
   *
   * @param properties options for this comparison rule
   * @return comparison rule to pass to data capturing functions
   */
  public static DecimalRule relative(final Consumer<RelativeOptions> properties) {
    RelativeOptions opts = new RelativeOptions();
    properties.accept(opts);
    return new DecimalRule(Mode.Relative, opts.min, Optional.empty(), opts.percent);
  }

  @Override
  public final JsonElement json() {
    JsonObject obj = new JsonObject();
    obj.addProperty("type", "number");
    obj.addProperty("mode",
        this.mode == Mode.Absolute ? "absolute" : "relative");
    if (this.min.isPresent()) {
      obj.addProperty("min", this.min.get());
    }
    if (this.max.isPresent()) {
      obj.addProperty("max", this.max.get());
    }
    if (this.percent.isPresent()) {
      obj.addProperty("percent", this.percent.get());
    }
    return obj;
  }

  @Override
  public final int serialize(final FlatBufferBuilder builder) {
    Schema.ComparisonRuleDouble.startComparisonRuleDouble(builder);
    Schema.ComparisonRuleDouble.addMode(builder, this.mode == Mode.Absolute
        ? Schema.ComparisonRuleMode.Absolute
        : Schema.ComparisonRuleMode.Relative);
    if (this.min.isPresent()) {
      Schema.ComparisonRuleDouble.addMin(builder, this.min.get());
    }
    if (this.max.isPresent()) {
      Schema.ComparisonRuleDouble.addMax(builder, this.max.get());
    }
    if (this.percent.isPresent()) {
      Schema.ComparisonRuleDouble.addPercent(builder, this.percent.get());
    }
    return Schema.ComparisonRuleDouble.endComparisonRuleDouble(builder);
  }
}
