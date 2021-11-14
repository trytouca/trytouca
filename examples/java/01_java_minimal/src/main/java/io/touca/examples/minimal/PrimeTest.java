// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.examples.minimal;

import io.touca.Touca;

public final class PrimeTest {

  @Touca.Workflow
  public void isPrime(final String testcase) {
    final int number = Integer.parseInt(testcase);
    Touca.check("output", Prime.isPrime(number));
  }

  public static void main(String[] args) {
    Touca.run(PrimeTest.class, args);
  }

}
