# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import touca
from threading import Thread
from students import (
    parse_profile,
    calculate_gpa,
    custom_function_1,
    custom_function_2,
    custom_function_3,
)


def main():
    touca.configure(api_url="https://api.touca.io/@/students/student-db")
    if not touca.is_configured():
        print(touca.configuration_error())
        return False

    for username in ["alice", "bob", "charlie"]:
        touca.declare_testcase(username)

        student = parse_profile(username)

        touca.add_assertion("username", student.username)
        touca.add_result("fullname", student.fullname)
        touca.add_result("birth_date", student.dob)
        touca.add_result("gpa", calculate_gpa(student.courses))

        custom_function_1(student)

        thread = Thread(target=custom_function_2, args=[student])
        thread.start()
        thread.join()

        touca.start_timer("func3")
        custom_function_3(student)
        touca.stop_timer("func3")

        touca.add_metric("external", 10)
        touca.post()

    touca.seal()
    touca.save_binary("touca_tutorial.bin")
    touca.save_json("touca_tutorial.json")


if __name__ == "__main__":
    main()
