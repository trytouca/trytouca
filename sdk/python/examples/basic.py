#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import touca
from dataclasses import dataclass
from typing import List
from time import sleep

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
    return dict({
        'alice': Student('alice', 'Alice Anderson', Date(2006, 3, 1),
            courses=[Course('math', 4.0), Course('computers', 3.8)]),
        'bob': Student('bob', 'Bob Brown', Date(1996, 6, 31),
            courses=[Course('english', 3.7), Course('history', 3.9)]),
        'charlie': Student('charlie', 'Charlie Clark', Date(2003, 9, 19),
            courses=[Course('math', 2.9), Course('computers', 3.7)])
    }).get(username)

def calculate_gpa(courses: List[Course]):
    return sum(k.grade for k in courses)/len(courses)

def custom_function(student: Student):
    sleep(.03)

def main():
    touca.configure(
        api_key="4e572164-379d-4ff2-ab5d-8c4cd6af2170",
        api_url="https://app.touca.io/api/@/students/student-db/1.0",
    )
    if not touca.is_configured():
        print(touca.configuration_error())
        return False

    for username in ['alice', 'bob', 'charlie']:
        touca.declare_testcase(username)

        student = parse_profile(username)

        touca.add_assertion("username", student.username)
        touca.add_result("fullname", student.fullname)
        touca.add_result("birth_date", student.dob)
        touca.add_result("gpa", calculate_gpa(student.courses))

        touca.start_timer("func3")
        custom_function(student)
        touca.stop_timer("func3")

        touca.add_metric("external", 10)

    touca.save_binary("touca_tutorial.bin")
    touca.save_json("touca_tutorial.json")
    touca.post()

if __name__ == '__main__':
    main()
