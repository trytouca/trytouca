# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.


def is_prime(number: int):
    for i in range(2, number):
        if number % i == 0:
            return False
    return True
