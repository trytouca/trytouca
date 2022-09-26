# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import touca
from is_prime import is_prime


@touca.workflow
def is_prime_test(testcase: str):
    touca.check("is_prime_output", is_prime(int(testcase)))
