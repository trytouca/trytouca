// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.minimal;

public final class Prime {
    public static boolean isPrime(final int number) {
        for (int i = 2; i < number; i++) {
            if (number % i == 0) {
                return false;
            }
        }
        return 1 < number;
    }
}
