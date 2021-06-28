#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from ._client import Client


class scoped_timer:
    def __init__(self, name):
        self._name = name

    def __enter__(self):
        Client.instance().start_timer(self._name)

    def __exit__(self, exc_type, exc_value, traceback):
        Client.instance().stop_timer(self._name)
