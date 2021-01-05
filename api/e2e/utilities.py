#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

import os
from dataclasses import dataclass
from typing import List

@dataclass
class User:
    fullname: str
    username: str
    email: str
    password: str

    def __repr__(self):
        return "User(\"{}\")".format(self.username)

    def __str__(self):
        return "\"{}\"".format(self.username)

    @classmethod
    def from_fullname(cls, fullname: str):
        username = fullname
        return cls(fullname=fullname, username=username,
            email = username + '@getweasel.com', password = 'Weasel$123')

@dataclass
class Team:
    slug: str
    owner: User
    admins: List[User]
    members: List[User]
    invitees: List[User]
    suites: List[str]

def pathify(rel_path: str) -> str:
    start = os.path.dirname(__file__)
    return os.path.abspath(os.path.join(start, rel_path))
