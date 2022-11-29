# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import students as code_under_test
import touca


@touca.workflow(testcases=["alice", "bob", "charlie"])
def students(username: str):
    with touca.scoped_timer("find_student"):
        student = code_under_test.find_student(username)
    touca.assume("username", student.username)
    touca.check("fullname", student.fullname)
    touca.check("birth_date", student.dob)
    touca.check("gpa", student.gpa, rule=touca.number_rule().absolute(min=3))
    touca.add_metric("external_source", 1500)
