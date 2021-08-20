# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import touca
from students import Course, calculate_gpa, parse_profile


def main():
    touca.configure()
    if not touca.is_configured():
        print(touca.configuration_error())
        return False

    for username in touca.get_testcases():
        touca.declare_testcase(username)

        touca.start_timer("parse_profile")
        student = parse_profile(username)
        touca.stop_timer("parse_profile")

        touca.add_assertion("username", student.username)
        touca.add_result("fullname", student.fullname)
        touca.add_result("birth_date", student.dob)

        touca.add_serializer(Course, lambda x: [x.name, x.grade])
        for course in student.courses:
            touca.add_array_element("courses", course)
            touca.add_hit_count("number of courses")

        with touca.scoped_timer("calculate_gpa"):
            touca.add_result("gpa", calculate_gpa(student.courses))
        touca.add_metric("external_source", 1500)

        touca.post()
        touca.save_json(f"touca_{username}.json")
        touca.save_binary(f"touca_{username}.bin")
        touca.forget_testcase(username)

    touca.seal()


if __name__ == "__main__":
    main()
