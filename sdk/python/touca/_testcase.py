#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from typing import Any


class Testcase:
    """ """

    def __init__(self, **kwargs):
        """ """
        self._results = {}
        pass

    def add_result(self, key: str, value: Any):
        """ """
        self._results[key] = value

    def add_assertion(self, key: str, value: Any):
        """ """
        pass

    def add_array_element(self, key: str, value: Any):
        """ """
        pass

    def add_hit_count(self, key: str):
        """ """
        pass

    def add_metric(self, key: str, value: Any):
        """ """
        pass

    def start_timer(self, key: str):
        """ """
        pass

    def stop_timer(self, key: str):
        """ """
        pass
