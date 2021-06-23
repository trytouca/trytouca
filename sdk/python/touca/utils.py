#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

def parse_environ(key: str, default=None):
    from os import environ

    if key not in environ:
        return default
    value = environ.get(key)
    if isinstance(default, str):
        return value
    if isinstance(default, bool):
        if value.lower() in ['true']:
            return True
        if value.lower() in ['false']:
            return False
        raise ValueError(f"environment variable '{key}' has invalid type")
    if isinstance(default, int):
        try:
            return int(value)
        except ValueError:
            raise ValueError(f"environment variable '{key}' has invalid type")
