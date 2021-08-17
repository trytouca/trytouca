# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from dataclasses import dataclass
from typing import List


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
    return sum(k.grade for k in courses) / len(courses) if courses else 0
