// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include <cmath>

bool is_prime(const unsigned long number)
{
    if (number < 2) {
        return false;
    }
    for (auto i = 2u; i < number; i++) {
        if (number % i == 0) {
            return false;
        }
    }
    return true;
}
