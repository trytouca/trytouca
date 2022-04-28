// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include <cmath>
#include <thread>

bool is_prime(const unsigned long number) {
  std::this_thread::sleep_for(std::chrono::milliseconds(100 + rand() % 50));
  for (auto i = 2u; i < number; i++) {
    if (number % i == 0) {
      return false;
    }
  }
  return 1 < number;
}
