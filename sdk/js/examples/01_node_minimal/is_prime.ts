// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

export function is_prime(input: number): boolean {
  for (let i = 2; i < input; i++) {
    if (input % i === 0) {
      return false;
    }
  }
  return 1 < input;
}
