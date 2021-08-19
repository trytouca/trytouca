# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from dataclasses import dataclass
from time import sleep
from typing import List
import touca


@dataclass
class Date:
    year: int
    month: int
    day: int


@dataclass
class Student:
    username: str
    fullname: str
    dob: Date
    gpa: float


@dataclass
class Course:
    name: str
    grade: float


@dataclass
class StudentData:
    username: str
    fullname: str
    dob: Date
    courses: List[Course]


students = [
    StudentData(
        "alice",
        "Alice Anderson",
        Date(2006, 3, 1),
        [Course("math", 4.0), Course("computers", 3.8)],
    ),
    StudentData(
        "bob",
        "Bob Brown",
        Date(1996, 6, 31),
        [Course("english", 3.7), Course("history", 3.9)],
    ),
    StudentData(
        "charlie",
        "Charlie Clark",
        Date(2003, 9, 19),
        [Course("math", 2.9), Course("computers", 3.7)],
    ),
]


def calculate_gpa(courses: List[Course]):
    touca.add_result("courses", courses)
    return sum(k.grade for k in courses) / len(courses) if courses else 0


def parse_profile(username: str) -> Student:
    sleep(0.1)
    data = next((k for k in students if k.username == username), None)
    if not data:
        raise ValueError(f"no student found for username: ${username}")
    return Student(data.username, data.fullname, data.dob, calculate_gpa(data.courses))
