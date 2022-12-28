# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from dataclasses import dataclass
from datetime import date
from random import random
from time import sleep
from typing import List


@dataclass
class Course:
    name: str
    grade: float


@dataclass
class Student:
    username: str
    fullname: str
    dob: date
    courses: List[Course]


students = [
    (
        "alice",
        "Alice Anderson",
        date(2006, 3, 1),
        [Course("math", 4.0), Course("computers", 3.8)],
    ),
    (
        "bob",
        "Bob Brown",
        date(1996, 6, 30),
        [Course("english", 3.7), Course("history", 3.9)],
    ),
    (
        "charlie",
        "Charlie Clark",
        date(2003, 9, 19),
        [Course("math", 2.9), Course("computers", 3.7)],
    ),
]


def calculate_gpa(courses: List[Course]):
    sleep(0.1 + random() * 0.05)
    return sum(k.grade for k in courses) / len(courses) if courses else 0


def find_student(username: str) -> Student:
    sleep(0.2 + random() * 0.05)
    data = next((k for k in students if k[0] == username), None)
    if not data:
        raise ValueError(f"no student found for username: ${username}")
    return Student(*data)
