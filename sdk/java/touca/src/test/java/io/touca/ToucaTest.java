// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import io.touca.Touca;
import org.junit.jupiter.api.Test;

public class ToucaTest {
    @Test
    public void configure() {
        Touca.configure(options -> {
            options.offline = true;
        });
    }
}
