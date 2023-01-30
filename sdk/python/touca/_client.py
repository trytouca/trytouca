# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from threading import get_ident
from typing import Any, Callable, Dict, Type, ValuesView

from touca._case import Case
from touca._options import ToucaError
from touca._rules import ComparisonRule
from touca._transport import Transport
from touca._types import BlobType, TypeHandler


def casemethod(func):
    """ """
    import inspect
    from functools import wraps

    func.__doc__ = inspect.getdoc(getattr(Case, func.__name__))

    @wraps(func)
    def wrapper(self, *args, **kwargs):
        element = self._active_testcase_name()
        if not element:
            return
        testcase = self._cases.get(element)
        method = getattr(testcase, func.__name__)
        retval = func(self, *args, **kwargs)
        if not retval:
            method(*args, **kwargs)
        else:
            method(args[0], retval, **kwargs)

    return wrapper


def serialize_messages(items):
    import touca_fbs as schema
    from flatbuffers import Builder

    builder = Builder()
    message_buffers = []
    for item in reversed(items):
        buffer = builder.CreateByteVector(item)
        schema.MessageBufferStart(builder)
        schema.MessageBufferAddBuf(builder, buffer)
        message_buffers.append(schema.MessageBufferEnd(builder))

    schema.MessageBufferStartBufVector(builder, len(message_buffers))
    for msg_buf in reversed(message_buffers):
        builder.PrependUOffsetTRelative(msg_buf)
    fbs_msg_buffers = builder.EndVector()

    schema.MessagesStart(builder)
    schema.MessagesAddMessages(builder, fbs_msg_buffers)
    fbs_messages = schema.MessagesEnd(builder)
    builder.Finish(fbs_messages)
    return builder.Output()


class Client:
    """ """

    @classmethod
    def instance(cls):
        if not hasattr(cls, "_instance"):
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self._cases: Dict[str, Case] = dict()
        self._configured = False
        self._configuration_error = str()
        self._options = dict()
        self._threads_case = str()
        self._threads_cases: Dict[int, str] = dict()
        self._transport = Transport()
        self._type_handler = TypeHandler()

    def _active_testcase_name(self) -> str:
        if not self._configured:
            return None
        if self._options.get("concurrency"):
            return self._threads_case
        return self._threads_cases.get(get_ident())

    def _prepare_save(self, path: str, cases) -> ValuesView[Case]:
        from pathlib import Path

        Path(path).parent.mkdir(parents=True, exist_ok=True)
        if cases:
            return [self._cases[x] for x in self._cases if x in cases]
        return self._cases.values()

    def _post(self, path: str, body):
        response = self._transport.request(
            method="POST",
            path=path,
            body=body,
            content_type="application/octet-stream",
        )
        if response.status == 204:
            return
        reason = ""
        if response.status == 400:
            error = response.data.decode("utf-8")
            if "batch is sealed" in error:
                reason = " This version is already submitted and sealed."
            if "team not found" in error:
                reason = " This team does not exist."
        raise ToucaError("post_failed", reason)

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
        the client, it attempts to authenticate with the Touca Server. You
        can explicitly disable this communication in rare cases by setting
        configuration option ``offline`` to ``False``.

        You can call :py:meth:`~configure` any number of times. The client
        preserves the configuration parameters specified in previous calls to
        this function.

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

        :type offline: bool, optional
        :param offline:
            determines whether client should connect with the Touca server
            during the configuration. Defaults to ``False`` when ``api_url``
            or ``api_key`` are provided.

        :type concurrency: bool, optional
        :param concurrency:
            determines whether the scope of test case declaration is bound to
            the thread performing the declaration, or covers all other threads.
            Defaults to ``True``.
            If set to ``True``, when a thread calls :py:meth:`~declare_testcase`,
            all other threads also have their most recent test case changed to
            the newly declared test case and any subsequent call to data
            capturing functions such as :py:meth:`~check`
            will affect the newly declared test case.
        """
        from touca._options import assign_options, update_core_options

        self._configuration_error = ""
        try:
            assign_options(self._options, kwargs)
            self._configured = update_core_options(self._options, self._transport)
        except RuntimeError as err:
            self._configuration_error = str(err)
            return False
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

    def declare_testcase(self, name: str):
        """
        Declares name of the test case to which all subsequent results will be
        submitted until a new test case is declared.

        If configuration parameter ``concurrency`` is set to ``"enabled"``, when
        a thread calls `declare_testcase` all other threads also have their most
        recent testcase changed to the newly declared one. Otherwise, each
        thread will submit to its own testcase.

        :param name:
            name of the testcase to be declared
        """
        if not self._configured:
            return
        if name not in self._cases:
            self._cases[name] = Case(
                team=self._options.get("team"),
                suite=self._options.get("suite"),
                version=self._options.get("version"),
                name=name,
            )
        self._threads_case = name
        self._threads_cases[get_ident()] = name
        return self._cases.get(name)

    def forget_testcase(self, name: str):
        """
        Removes all logged information associated with a given test case.

        This information is removed from memory, such that switching back to
        an already-declared or already-submitted test case would behave similar
        to when that test case was first declared. This information is removed,
        for all threads, regardless of the configuration option ``concurrency``.
        Information already submitted to the server will not be removed from
        the server.

        This operation is useful in long-running regression test frameworks,
        after submission of test case to the server, if memory consumed by
        the client library is a concern or if there is a risk that a future
        test case with a similar name may be executed.

        :param name:
            name of the testcase to be removed from memory

        :raises ToucaError:
            when called with the name of a test case that was never declared
        """
        if name not in self._cases:
            raise ToucaError("testcase_forget", name)
        del self._cases[name]

    @casemethod
    def check(self, key: str, value: Any, *, rule: ComparisonRule = None):
        return self._type_handler.transform(value)

    @casemethod
    def check_file(self, key: str, file):
        return

    @casemethod
    def assume(self, key: str, value: Any):
        return self._type_handler.transform(value)

    @casemethod
    def add_array_element(self, key: str, value: Any):
        return self._type_handler.transform(value)

    @casemethod
    def add_hit_count(self, key: str):
        return

    @casemethod
    def add_metric(self, key: str, milliseconds: int):
        return milliseconds

    @casemethod
    def start_timer(self, key: str):
        return

    @casemethod
    def stop_timer(self, key: str):
        return

    def add_serializer(self, datatype: Type, serializer: Callable[[Any], Dict]):
        """
        Registers custom serialization logic for a given custom data type.

        Calling this function is rarely needed. The library already handles
        all custom data types by serializing all their properties. Custom
        serializers allow you to exclude a subset of an object properties
        during serialization.

        :param datattype: type to be serialized
        :param serializer: function that converts any object of the given type
            to a dictionary.
        """
        self._type_handler.add_serializer(datatype, serializer)

    def save_binary(self, path: str, cases: list):
        """
        Stores test results and performance benchmarks in binary format
        in a file of specified path.

        Touca binary files can be submitted at a later time to the Touca
        server.

        We do not recommend as a general practice for regression test tools
        to locally store their test results. This feature may be helpful for
        special cases such as when regression test tools have to be run in
        environments that have no access to the Touca server (e.g. running
        with no network access).

        :param path: path to file in which test results and performance
            benchmarks should be stored
        :param cases: names of test cases  whose results should be stored.
            If a set is not specified or is set as empty, all test cases will
            be stored in the specified file.
        """
        items = self._prepare_save(path, cases)
        content = serialize_messages([item.serialize() for item in items])
        with open(path, mode="wb") as file:
            file.write(content)

    def save_json(self, path: str, cases: list):
        """
        Stores test results and performance benchmarks in JSON format
        in a file of specified path.

        This feature may be helpful during development of regression tests
        tools for quick inspection of the test results and performance metrics
        being captured.

        :param path: path to file in which test results and performance
            benchmarks should be stored
        :param cases: names of test cases  whose results should be stored.
            If a set is not specified or is set as empty, all test cases will
            be stored in the specified file.
        """
        from json import dumps

        items = self._prepare_save(path, cases)
        content = dumps([testcase.json() for testcase in items])
        with open(path, mode="wt") as file:
            file.write(content)

    def post(self):
        """
        Submits all test results recorded so far to Touca server.

        It is possible to call :py:meth:`~post` multiple times during runtime
        of the regression test tool. Test cases already submitted to the server
        whose test results have not changed, will not be resubmitted.
        It is also possible to add test results to a testcase after it is
        submitted to the server. Any subsequent call to :py:meth:`~post` will
        resubmit the modified test case.

        :raises ToucaError:
            when called on the client that is not configured to communicate
            with the Touca server.
        """
        if not self._configured or self._options.get("offline"):
            raise ToucaError("client_not_configured")
        content = serialize_messages(
            [item.serialize() for item in self._cases.values()]
        )
        self._post("/client/submit", content)
        slugs = "/".join(self._options.get(x) for x in ["team", "suite", "version"])
        for case in self._cases.values():
            testcase_name = case._metadata().get("testcase")
            for key, value in case._results.items():
                if isinstance(value.val, BlobType):
                    self._post(
                        f"/client/submit/artifact/{slugs}/{testcase_name}/{key}",
                        value.val._value.binary(),
                    )

    def seal(self):
        """
        Notifies the Touca server that all test cases were executed for this
        version and no further test result is expected to be submitted.
        Expected to be called by the test tool once all test cases are executed
        and all test results are posted.

        Sealing the version is optional. The Touca server automatically
        performs this operation once a certain amount of time has passed since
        the last test case was submitted. This duration is configurable from
        the "Settings" tab in "Suite" Page.

        :raises ToucaError:
            when called on the client that is not configured to communicate
            with the Touca server.
        """
        if not self._configured or self._options.get("offline"):
            raise ToucaError("client_not_configured")
        slugs = "/".join(self._options.get(x) for x in ["team", "suite", "version"])
        response = self._transport.request(method="POST", path=f"/batch/{slugs}/seal2")
        if response.status == 403:
            raise ToucaError("auth_invalid_key")
        if response.status != 204:
            raise ToucaError("seal_failed")
