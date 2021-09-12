// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.core;

import io.touca.Touca;

public class Main {
    public static void main(String[] args) {
        Touca.configure(options -> {
            options.offline = true;
        });
    }
}
