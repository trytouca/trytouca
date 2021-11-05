# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import touca
from students import find_student


@touca.Workflow
def students_test(username: str):
    with touca.scoped_timer("find_student"):
        student = find_student(username)
    touca.add_assertion("username", student.username)
    touca.add_result("fullname", student.fullname)
    touca.add_result("birth_date", student.dob)
    touca.add_result("gpa", student.gpa)
    touca.add_metric("external_source", 1500)


if __name__ == "__main__":
    touca.run()
