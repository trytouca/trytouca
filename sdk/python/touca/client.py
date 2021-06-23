#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from typing import Any, List

class Client(object):
    """
    """

    @classmethod
    def instance(cls):
        """
        """
        if not hasattr(cls, '_instance'):
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        """
        """
        self._configured = False
        self._configuration_error = str()

    def _configure_by_file(self, path: str) -> bool:
        """
        """
        import json
        import os

        if not os.path.isfile(path):
            self._parse_error = 'configuration file is missing'
            return False
        # read file as json and parse it into memory
        with open(path, "rt") as file:
            original_file_content = file.read()
            try:
                parsed_file_content = json.loads(original_file_content)
            except ValueError:
                self._parse_error = 'configuration file is invalid'
                return False
        # check if config file includes a touca field
        if 'touca' not in parsed_file_content:
            self._parse_error = 'configuration file is missing top-level field: "touca"'
            return False
        return self.configure(**parsed_file_content)

    def configure(self, **kwargs) -> bool:
        """
        Configures the Touca client. Must be called before declaring test cases
        and adding results to the client. Should be regarded as a potentially
        expensive operation. Should be called only from your test environment.

        :py:meth:`~configure` takes a variety of configuration parameters
        documented below. All of these parameters are optional. Calling this
        function without any parameters is possible: the client can capture
        behavior and performance data and store them on a local filesystem
        but it will not be able to post them to the Touca server.

        In most cases, You will need to pass API Key and API URL during the
        configuration. The code below shows the common pattern in which API URL
        is given in long format (it includes the team slug and the suite slug)
        and API Key as well as the version of the code under test are specified
        as environment variables ``TOUCA_API_KEY`` and ``TOUCA_TEST_VERSION``,
        respectively::

            touca.configure(api_url='https://api.touca.io/@/acme/students')
            if not touca.is_configured():
                print(touca.configuration_error())

        As long as the API Key and API URL to the Touca server are known to
        the client, it attempts to perform a handshake with the Touca Server to
        authenticate with the server and obtain the list of known test cases
        for the baseline version of the specified suite. You can explicitly
        disable this handshake in rare cases where you want to prevent ever
        communicating with the Touca server.

        You can call :py:meth:`~configure` any number of times. The client
        preserves the configuration parameters specified in previous calls to
        this function.

        :param file: (optional) Path to a configuration file in JSON format
            with a top-level "touca" field that may list any number of
            configuration parameters for this function. Passing parameters that
            are already specified in the file will override them.
        :param api_key: (optional) API Key issued by the Touca server that
            identifies who is submitting the data. Since the value should be
            treated as a secret, we recommend that you pass it as an environment
            variable ``TOUCA_API_KEY`` instead.
        :param api_url: (optional) URL to the Touca server API.
            Can be provided either in long format like
            ``https://api.touca.io/@/myteam/mysuite/version``
            or in short format like ``https://api.touca.io``.
            If the team, suite, or version are specified, you do not need to
            specify them separately.
        :param team: (optional) slug of your team on the Touca server.
        :param suite: (optional) slug of the suite on the Touca server that
            corresponds to your workflow under test.
        :param version: (optional) version of your workflow under test.
        :param handshake: (optional) determines whether client should
            connect with the Touca server during the configuration. Defaults
            to ``True`` when ``api_url`` and ``api_key`` are provided.
        :param concurrency: (optional) determines whether the scope of
            test case declaration is bound to the thread performing the
            declaration, or covers all other threads. Can be one of "enabled"
            or "disabled". Defaults to "enabled". If set to "enabled", when a
            thread calls :py:meth:`~declare_testcase`,
            all other threads also have their most recent test case changed to
            the newly declared test case and any subsequent call to data
            capturing functions such as :py:meth:`~add_result`
            will affect the newly declared test case.
        :return: ``True`` if client is ready to capture data.
        :rtype: bool
        """
        self._configured = True
        return True

    def is_configured(self) -> bool:
        """
        """
        return self._configured

    def configuration_error(self) -> str:
        """
        """
        return self._configuration_error

    def get_testcases(self) -> List[str]:
        """
        """
        return []

    def declare_testcase(self, name: str) -> None:
        """
        """

    def forget_testcase(self, name: str) -> None:
        """
        """

    def add_result(self, key: str, value: Any) -> None:
        """
        """

    def add_assertion(self, key: str, value: Any) -> None:
        """
        """

    def add_array_element(self, key: str, value: Any) -> None:
        """
        """

    def add_hit_count(self, key: str) -> None:
        """
        """

    def add_metric(self, key: str, value: int) -> None:
        """
        """

    def start_timer(self, key: str) -> None:
        """
        """

    def stop_timer(self, key: str) -> None:
        """
        """

    def save(self, key: str, cases: List[str] = [], overwrite = True, format = 'binary'):
        """
        """
        return

    def post(self) -> bool:
        """
        """
        return

    def seal(self) -> bool:
        """
        """
        return
