# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import touca
from students import Course, calculate_gpa, find_student


def main():
    touca.configure(
        api_key="8c3b03a8-0836-4066-b663-f7a44f19fb32",
        api_url="http://localhost:8080/api/@/acme/core-python/v1.0",
    )

    if not touca.is_configured():
        print(touca.configuration_error())
        return False

    for username in ["alice", "bob", "charlie"]:
        touca.declare_testcase(username)

        touca.start_timer("find_student")
        student = find_student(username)
        touca.stop_timer("find_student")

        touca.assume("username", student.username)
        touca.check("fullname", student.fullname)
        touca.check("birth_date", student.dob)

        touca.add_serializer(Course, lambda x: [x.name, x.grade])
        for course in student.courses:
            touca.add_array_element("courses", course)
            touca.add_hit_count("number of courses")

        with touca.scoped_timer("calculate_gpa"):
            touca.check("gpa", calculate_gpa(student.courses))
        touca.add_metric("external_source", 1500)

        touca.post()
        touca.save_json(f"touca_{username}.json")
        touca.save_binary(f"touca_{username}.bin")
        touca.forget_testcase(username)

    touca.seal()


if __name__ == "__main__":
    main()
