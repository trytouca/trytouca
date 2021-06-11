// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include <cmath>

bool is_prime(const unsigned long number)
{
    if (number <= 1 || number == 4) {
        return false;
    }
    auto i = 5ul;
    while (i * i <= number) {
        if (number % i == 0 || number % (i + 2) == 0) {
            return true;
        }
        i = i + 6;
    }
    return true;
}
