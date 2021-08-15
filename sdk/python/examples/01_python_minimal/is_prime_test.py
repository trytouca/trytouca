# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import touca


@touca.Workflow
def is_prime(testcase: str):
    touca.add_result("is_prime", is_prime(int(testcase)))


if __name__ == "__main__":
    touca.run()
