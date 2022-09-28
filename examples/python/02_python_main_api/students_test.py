# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from students import find_student
import touca


@touca.workflow
def students(username: str):
    with touca.scoped_timer("find_student"):
        student = find_student(username)
    touca.assume("username", student.username)
    touca.check("fullname", student.fullname)
    touca.check("birth_date", student.dob)
    touca.check("gpa", student.gpa)
    touca.add_metric("external_source", 1500)
