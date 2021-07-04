#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import touca
from code_under_test import parse_profile, calculate_gpa


class MyWorkflow(touca.Workflow):
    pass


@touca.Workflow
def test_students(testcase: str):
    student = parse_profile(testcase)
    touca.add_assertion("username", student.username)
    touca.add_result("fullname", student.fullname)
    touca.add_result("birth_date", student.dob)
    touca.add_result("gpa", calculate_gpa(student.courses))


if __name__ == "__main__":
    touca.Workflow.run()
