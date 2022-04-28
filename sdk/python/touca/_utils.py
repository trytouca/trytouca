# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from touca._client import Client


class scoped_timer:
    def __init__(self, name):
        """
        Creates a timer object that captures its own lifetime and associates it
        with a given name.

        :param name: name to be associated with the captured runtime
        """
        self._name = name

    def __enter__(self):
        Client.instance().start_timer(self._name)

    def __exit__(self, exc_type, exc_value, traceback):
        Client.instance().stop_timer(self._name)
