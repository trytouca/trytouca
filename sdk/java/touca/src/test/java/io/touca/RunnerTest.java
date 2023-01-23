// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import static org.junit.jupiter.api.Assertions.assertThrowsExactly;

import io.touca.core.Client;
import io.touca.core.GracefulExitException;
import io.touca.core.Runner;
import io.touca.core.WorkflowOptions;
import java.util.HashMap;
import org.junit.jupiter.api.Test;

public final class RunnerTest {

  public class Example {
    @Touca.Workflow
    public void sample(final String name) {
    }
  }

  @Test
  void buildRunner() {
    assertThrowsExactly(GracefulExitException.class, () -> {
      new Runner(new Client()).run(Example.class, new String[] { "example",
          "--help" },
          new HashMap<String, WorkflowOptions>());
    });
  }
}
