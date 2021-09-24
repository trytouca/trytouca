// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.minimal;

import io.touca.Touca;

public final class PrimeTest {
  public static void main(String[] args) {
    Touca.workflow("is_prime_test", (final String testcase) -> {
      final int number = Integer.parseInt(testcase);
      Touca.addResult("is_prime_output", Prime.isPrime(number));
    });
    Touca.run(args);
  }
}
