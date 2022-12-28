# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from dataclasses import dataclass
from datetime import date
from random import random
from time import sleep
from typing import List

import touca


@dataclass
class Course:
    name: str
    grade: float


@dataclass
class Student:
    username: str
    fullname: str
    dob: date
    gpa: float


students = [
    (
        "alice",
        "Alice Anderson",
        date(2006, 3, 1),
        [Course("computers", 3.8), Course("math", 4.0)],
    ),
    (
        "bob",
        "Bob Brown",
        date(1996, 6, 30),
        [Course("history", 3.9), Course("english", 3.7)],
    ),
    (
        "charlie",
        "Charlie Clark",
        date(2003, 9, 19),
        [Course("computers", 3.7), Course("math", 2.9)],
    ),
]


def calculate_gpa(courses: List[Course]):
    for course in courses:
        touca.add_array_element("courses", course)
        touca.add_hit_count("number of courses")
    return sum(k.grade for k in courses) / len(courses) if courses else 0


def find_student(username: str) -> Student:
    sleep(0.2 + random() * 0.05)
    data = next((k for k in students if k[0] == username), None)
    if not data:
        raise ValueError(f"no student found for username: {username}")
    return Student(data[0], data[1], data[2], calculate_gpa(data[3]))
