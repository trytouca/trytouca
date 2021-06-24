#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from typing import Any, List
from threading import get_ident
from touca._transport import Transport


class Client:
    """ """

    @classmethod
    def instance(cls):
        """ """
        if not hasattr(cls, "_instance"):
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        """ """
        self._configured = False
        self._configuration_error = str()
        self._cases = list()
        self._options = dict()
        self._threads_case = str()
        self._threads_cases = dict()
        self._transport = None

    def _has_active_case(self) -> bool:
        if not self._configured:
            return False
        if self._options["concurrent"]:
            return bool(self._threads_case)
        return get_ident() in self._thread_map

    def _make_transport(self) -> bool:
        keys = ["api_key", "api_url", "team", "suite", "version"]
        if self._options.get("handshake") is False:
            return False
        if not all(k in self._options for k in keys):
            return False
        if not self._transport or any(
            self._transport._options.get(k) != self._options.get(k) for k in keys
        ):
            self._transport = Transport(self._options)
            return True

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

        As long as the API Key and API URL to the Touca server are known to
        the client, it attempts to perform a handshake with the Touca Server to
        authenticate with the server and obtain the list of known test cases
        for the baseline version of the specified suite. You can explicitly
        disable this handshake in rare cases where you want to prevent ever
        communicating with the Touca server.

        You can call :py:meth:`~configure` any number of times. The client
        preserves the configuration parameters specified in previous calls to
        this function.

        :type file: str, optional
        :param file:
            (optional) Path to a configuration file in JSON format with a
            top-level "touca" field that may list any number of configuration
            parameters for this function. When used alongside other parameters,
            those parameters would override values specified in the file.

        :type api_key: str, optional
        :param api_key:
            (optional) API Key issued by the Touca server that
            identifies who is submitting the data. Since the value should be
            treated as a secret, we recommend that you pass it as an environment
            variable ``TOUCA_API_KEY`` instead.

        :type api_url: str, optional
        :param api_url:
            (optional) URL to the Touca server API.
            Can be provided either in long format like
            ``https://api.touca.io/@/myteam/mysuite/version``
            or in short format like ``https://api.touca.io``.
            If the team, suite, or version are specified, you do not need to
            specify them separately.

        :type team: str, optional
        :param team:
            (optional) slug of your team on the Touca server.

        :type suite: str, optional
        :param suite:
            slug of the suite on the Touca server that corresponds to your
            workflow under test.

        :type version: str, optional
        :param version:
            version of your workflow under test.

        :param handshake:
            determines whether client should
            connect with the Touca server during the configuration. Defaults
            to ``True`` when ``api_url`` and ``api_key`` are provided.
        :type handshake: bool, optional

        :type concurrency: str, optional
        :param concurrency:
            determines whether the scope of
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
        from touca._options import update_options

        self._configuration_error = ""

        try:
            update_options(self._options, kwargs)
            if self._make_transport():
                self._transport.authenticate()
                self._cases = self._transport.get_testcases()
        except ValueError as err:
            self._configuration_error = str(err)
            return False

        self._configured = True
        return True

    def is_configured(self) -> bool:
        """
        Checks if previous call(s) to :py:meth:`~configure` have set the right
        combination of configuration parameters to enable the client to perform
        expected tasks.

        We recommend that you perform this check after client configuration and
        before calling other functions of the library::

            if not touca.is_configured():
                print(touca.configuration_error())
                sys.exit(1)

        At a minimum, the client is considered configured if it can capture
        test results and store them locally on the filesystem. A single call
        to :py:meth:`~configure` without any configuration parameters can help
        us get to this state. However, if a subsequent call to :py:meth:`~configure`
        sets the parameter ``api_url`` in short form without specifying
        parameters such as ``team``, ``suite`` and ``version``, the client
        configuration is incomplete: We infer that the user intends to submit
        results but the provided configuration parameters are not sufficient
        to perform this operation.

        :return: ``True`` if the client is properly configured
        :rtype: bool
        :see also: :py:meth:`~configure`
        """
        return self._configured

    def configuration_error(self) -> str:
        """
        Provides the most recent error, if any, that is encountered during
        client configuration.

        :return: short description of the most recent configuration error
        :rtype: str
        """
        return self._configuration_error

    def get_testcases(self) -> List[str]:
        """
        Queries the Touca server for the list of testcases that are submitted
        to the baseline version of this suite.

        :raises: RuntimeError
            if called on the client that is not properly configured to
            communicate with the Touca server.

        :return: list of test cases of the baseline version of this suite
        """
        return self._cases

    def declare_testcase(self, name: str) -> None:
        """ """

    def forget_testcase(self, name: str) -> None:
        """ """

    def add_result(self, key: str, value: Any) -> None:
        """ """

    def add_assertion(self, key: str, value: Any) -> None:
        """ """

    def add_array_element(self, key: str, value: Any) -> None:
        """ """

    def add_hit_count(self, key: str) -> None:
        """ """

    def add_metric(self, key: str, value: int) -> None:
        """ """

    def start_timer(self, key: str) -> None:
        """ """

    def stop_timer(self, key: str) -> None:
        """ """

    def save(self, key: str, cases: List[str] = [], overwrite=True, format="binary"):
        """ """
        return

    def post(self) -> bool:
        """ """
        if not self._transport:
            raise RuntimeError("client not configured to perform this operation")
        return

    def seal(self) -> bool:
        """ """
        if not self._transport:
            raise RuntimeError("client not configured to perform this operation")
        return
