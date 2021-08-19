# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import touca
from is_prime import is_prime


@touca.Workflow
def is_prime_test(testcase: str):
    touca.add_result("is_prime_output", is_prime(int(testcase)))


if __name__ == "__main__":
    touca.run()
