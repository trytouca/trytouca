#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import touca
from dataclasses import dataclass
from typing import List
from time import sleep
from threading import Thread


@dataclass
class Date:
    year: int
    month: int
    day: int


@dataclass
class Course:
    name: str
    grade: float


@dataclass
class Student:
    username: str
    fullname: str
    dob: Date
    courses: List[Course]


def parse_profile(username: str) -> Student:
    return dict(
        {
            "alice": Student(
                "alice",
                "Alice Anderson",
                Date(2006, 3, 1),
                courses=[Course("math", 4.0), Course("computers", 3.8)],
            ),
            "bob": Student(
                "bob",
                "Bob Brown",
                Date(1996, 6, 31),
                courses=[Course("english", 3.7), Course("history", 3.9)],
            ),
            "charlie": Student(
                "charlie",
                "Charlie Clark",
                Date(2003, 9, 19),
                courses=[Course("math", 2.9), Course("computers", 3.7)],
            ),
        }
    ).get(username)


def calculate_gpa(courses: List[Course]):
    return sum(k.grade for k in courses) / len(courses)


def custom_function_1(student: Student):
    with touca.scoped_timer(custom_function_1.__name__):
        touca.add_result("is_adult", 18 <= 2021 - student.dob.year)
        sleep(0.05)


def custom_function_2(student: Student):
    for idx, _ in enumerate(student.courses, start=1):
        with touca.scoped_timer(f"func2_course_{idx}"):
            touca.add_hit_count("number of courses")
            sleep(0.05)


def custom_function_3(student: Student):
    for course in student.courses:
        touca.add_array_element("course_names", course.name)
    sleep(0.05)


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
