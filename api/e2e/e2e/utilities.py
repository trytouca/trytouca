# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import os
from dataclasses import dataclass
from pathlib import Path
from typing import List

from dotenv import dotenv_values

config = {
    **dotenv_values(Path(__file__).resolve().parent.parent.joinpath("data", "e2e.env")),
    **os.environ,
}


@dataclass
class User:
    fullname: str
    email: str
    password: str

    def __repr__(self):
        return 'User("{}")'.format(self.email)

    def __str__(self):
        return '"{}"'.format(self.email)

    @classmethod
    def from_firstname(cls, firstname: str):
        return cls(
            fullname=firstname,
            email=f"{firstname}@touca.io",
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
