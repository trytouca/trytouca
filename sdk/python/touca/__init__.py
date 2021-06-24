#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

"""
Entry-point to the Touca SDK for Python.

You can install this sdk via ``pip install touca`` and import it in your code via::

    import touca

Alternatively, you can import individual functions which may be useful in rare
cases if and when you want to call them from production code::

    from touca import add_result

If you are just getting started with Touca, we generally recommend that you
install the SDK as a development-only dependency.
"""

import inspect
from typing import Any, List
from touca._client import Client


def clientmethod(f):
    f.__doc__ = inspect.getdoc(getattr(Client, f.__name__))
    return f


@clientmethod
def configure(**kwargs) -> bool:
    return Client.instance().configure(**kwargs)


@clientmethod
def is_configured() -> bool:
    return Client.instance().is_configured()


@clientmethod
def configuration_error() -> str:
    return Client.instance().configuration_error()


@clientmethod
def get_testcases() -> List[str]:
    return Client.instance().get_testcases()


@clientmethod
def declare_testcase(name: str) -> None:
    Client.instance().declare_testcase(name)


@clientmethod
def forget_testcase(name: str) -> None:
    Client.instance().forget_testcase(name)


@clientmethod
def add_result(key: str, value: Any) -> None:
    Client.instance().add_result(key, value)


@clientmethod
def add_assertion(key: str, value: Any) -> None:
    Client.instance().add_assertion(key, value)


@clientmethod
def add_array_element(key: str, value: Any) -> None:
    Client.instance().add_array_element(key, value)


@clientmethod
def add_hit_count(key: str) -> None:
    Client.instance().add_hit_count(key)


@clientmethod
def add_metric(key: str, value: int) -> None:
    Client.instance().add_metric(key, value)


@clientmethod
def start_timer(key: str) -> None:
    Client.instance().start_timer(key)


@clientmethod
def stop_timer(key: str) -> None:
    Client.instance().stop_timer(key)


def save_binary(key: str, cases: List[str] = [], overwrite=True) -> None:
    Client.instance().save(key, cases, overwrite, format="binary")


def save_json(key: str, cases: List[str] = [], overwrite=True) -> None:
    Client.instance().save(key, cases, overwrite, format="json")


@clientmethod
def post() -> bool:
    return Client.instance().post()


@clientmethod
def seal() -> bool:
    return Client.instance().seal()
