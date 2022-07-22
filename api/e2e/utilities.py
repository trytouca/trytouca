# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import os
from dataclasses import dataclass
from typing import List
from pathlib import Path
from dotenv import dotenv_values

config = {**dotenv_values(Path(__file__).resolve().with_name("e2e.env")), **os.environ}


@dataclass
class User:
    fullname: str
    username: str
    email: str
    password: str

    def __repr__(self):
        return 'User("{}")'.format(self.username)

    def __str__(self):
        return '"{}"'.format(self.username)

    @classmethod
    def from_fullname(cls, fullname: str):
        username = fullname
        return cls(
            fullname=fullname,
            username=username,
            email=username + "@touca.io",
            password="Touca$123",
        )


@dataclass
class Team:
    slug: str
    owner: User
    admins: List[User]
    members: List[User]
    invitees: List[User]
    suites: List[str]


def build_path(rel_path: str) -> str:
    return Path(__file__).resolve().parent.joinpath(rel_path)
