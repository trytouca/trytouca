# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from argparse import Action, ArgumentParser
from configparser import ConfigParser
from pathlib import Path
from typing import List

from touca._transport import Transport


class ToucaError(RuntimeError):
    codes = {
        "auth_invalid_key": "Authentication failed: API Key Invalid.",
        "auth_invalid_response": "Authentication failed: Invalid Response.",
        "auth_server_down": "Touca server appears to be down",
        "config_file_invalid": 'Configuration file has an unexpected format: "{}"',
        "config_file_missing": 'Configuration file does not exist: "{}"',
        "config_option_invalid": 'Configuration option "{}" has unexpected type.',
        "config_option_missing": 'Configuration option "{}" is missing.',
        "client_not_configured": "Client not configured to perform this operation.",
        "post_failed": "Failed to submit test results.{}",
        "seal_failed": "Failed to seal this version.",
        "testcase_forget": 'Test case "{}" was never declared.',
        "transport_http": "HTTP request failed: {}",
        "transport_options": "Failed to fetch options from the remote server.",
        "remote_options_sealed": "The specified version is already submitted.",
        "type_mismatch": 'Specified key "{}" has a different type.',
        "workflows_missing": "No workflow is registered.",
    }

    def __init__(self, code: str, *args):
        message = ToucaError.codes.get(code)
        super().__init__(message.format(*args))


def find_home_path():
    path = Path.cwd().joinpath(".touca")
    return path if path.exists() else Path.home().joinpath(".touca")


def find_profile_path():
    home_path = find_home_path()
    settings_path = Path(home_path, "settings")
    name = "default"
    if settings_path.exists():
        config = ConfigParser()
        config.read_string(settings_path.read_text())
        name = config.get("settings", "profile")
    return home_path.joinpath("profiles", name)


def parse_config_profile():
    path = find_profile_path()
    if path.exists():
        config = ConfigParser()
        config.read_string(path.read_text())
        return config


def throw_if_missing(options, keys):
    missing = [key for key in keys if key not in options]
    if missing:
        raise ToucaError("config_option_missing", missing[0])


def validate_options_type(options: dict, cls, keys: List[str]):
    invalid = [
        key for key in keys if key in options and not isinstance(options[key], cls)
    ]
    if invalid:
        raise ToucaError("config_option_invalid", invalid[0])


def fixup_flags(options: dict):
    for k in [
        "colored_output",
        "offline",
        "overwrite_results",
        "save_binary",
        "save_json",
    ]:
        if k in options:
            options[k] = options.get(k) in [True, "True", "true"]


def prepare_parser(parser: ArgumentParser):
    class ExtendAction(Action):
        def __call__(self, parser, namespace, values, option_string=None):
            items = getattr(namespace, self.dest) or []
            items.extend(values)
            setattr(namespace, self.dest, items)

    parser.register("action", "extend", ExtendAction)
    parser.add_argument("--api-key", help="Touca API Key", dest="api_key")
    parser.add_argument("--api-url", help="Touca API URL", dest="api_url")
    parser.add_argument(
        "--team",
        dest="team",
        help="Slug of team to which test results belong",
    )
    parser.add_argument(
        "--suite",
        dest="suite",
        help="Slug of suite to which test results belong",
    )
    parser.add_argument(
        "--revision",
        dest="version",
        help="Version of the code under test",
    )
    parser.add_argument(
        "--offline",
        dest="offline",
        const=True,
        default=False,
        nargs="?",
        help="Disables all communications with the Touca server",
    )
    parser.add_argument(
        "--save-as-binary",
        dest="save_binary",
        const=True,
        default=False,
        nargs="?",
        help="Save a copy of test results on local filesystem in binary format",
    )
    parser.add_argument(
        "--save-as-json",
        dest="save_json",
        const=True,
        default=False,
        nargs="?",
        help="Save a copy of test results on local filesystem in JSON format",
    )
    parser.add_argument(
        "--output-directory",
        dest="output_directory",
        help="Path to a local directory to store result files",
    )
    parser.add_argument(
        "--overwrite",
        dest="overwrite_results",
        const=True,
        default=False,
        nargs="?",
        help="Overwrite result directory for testcase if it already exists",
    )
    parser.add_argument(
        "--testcase",
        "--testcases",
        dest="testcases",
        action="extend",
        nargs="+",
        help="One or more testcases to feed to the workflow",
    )
    parser.add_argument(
        "--filter",
        dest="workflow_filter",
        help="Name of the workflow to run",
    )
    parser.add_argument(
        "--log-level",
        dest="log_level",
        choices=["debug", "info", "warn"],
        default="info",
        help="Level of detail with which events are logged",
    )
    parser.add_argument(
        "--colored-output",
        dest="colored_output",
        const=True,
        default=True,
        nargs="?",
        help="Use color in standard output",
    )
    parser.add_argument(
        "--config-file",
        help="Path to a configuration file",
        dest="config_file",
    )


def assign_options(target: dict, source: dict):
    target_keys = {
        "api_key": "api_key",
        "api_url": "api_url",
        "team": "team",
        "suite": "suite",
        "version": "version",
        "offline": "offline",
        "save_binary": "save_binary",
        "save_json": "save_json",
        "output_directory": "output_directory",
        "overwrite_results": "overwrite_results",
        "testcases": "testcases",
        "workflow_filter": "workflow_filter",
        "log_level": "log_level",
        "colored_output": "colored_output",
        "config_file": "config_file",
        "api-key": "api_key",
        "api-url": "api_url",
        "revision": "version",
        "save-as-binary": "save_binary",
        "save-as-json": "save_json",
        "output-directory": "output_directory",
        "overwrite": "overwrite_results",
        "filter": "workflow_filter",
        "log-level": "log_level",
        "colored-output": "colored_output",
        "config-file": "config_file",
    }
    for key, value in source.items():
        if value is not None and key in target_keys:
            target[target_keys[key]] = value


def apply_environment_variables(options):
    from os import environ

    assign_options(
        options,
        {
            "api_key": environ.get("TOUCA_API_KEY"),
            "api_url": environ.get("TOUCA_API_URL"),
            "version": environ.get("TOUCA_TEST_VERSION"),
        },
    )


def apply_cli_arguments(options: dict):
    from sys import argv

    parser = ArgumentParser(
        description="Touca Test Runner",
        epilog="See https://touca.io/docs for more information.",
    )
    prepare_parser(parser)
    parsed = vars(parser.parse_known_args(options.get("arguments", argv[1:]))[0])
    assign_options(options, parsed)
    fixup_flags(options)


def apply_config_file(options: dict):
    from json import loads

    if "config_file" not in options:
        return
    file = Path(options.get("config_file")).resolve()
    if not file.is_file():
        raise ToucaError("config_file_missing", file)
    try:
        parsed = loads(file.read_text())
    except ValueError:
        raise ToucaError("config_file_invalid", file)
    if "touca" not in parsed:
        raise ToucaError("config_file_invalid", file)
    assign_options(options, parsed.get("touca"))


def apply_config_profile(options: dict):
    config = parse_config_profile()
    if config and config.has_section("settings"):
        assign_options(options, config["settings"])
        fixup_flags(options)


def apply_api_url(options: dict):
    from urllib.parse import urlparse

    if "api_url" not in options:
        return
    url = urlparse(options.get("api_url"))
    url_path = [k.strip("/") for k in url.path.split("/@/")]
    options["api_url"] = f"{url.scheme}://{url.netloc}/{url_path[0]}".rstrip("/")
    if len(url_path) == 1:
        return
    slugs = [k for k in url_path[1].split("/") if k]
    assign_options(options, dict(zip(["team", "suite", "version"], slugs)))


def apply_core_options(options: dict):
    options.setdefault("concurrency", True)
    if not options.get("offline"):
        options["offline"] = all(x not in options for x in ["api_key", "api_url"])
    if "api_key" in options and "api_url" not in options:
        options["api_url"] = "https://api.touca.io"


def authenticate(options: dict, transport: Transport):
    if (
        options.get("offline") == False
        and "api_key" in options
        and "api_url" in options
    ):
        transport.configure(options)


def apply_runner_options(options: dict):
    options.setdefault("output_directory", find_home_path().joinpath("results"))
    options.setdefault("workflows", [])
    if "workflow_filter" in options:
        options["workflows"] = list(
            filter(
                lambda x: x.get("suite") == options.get("workflow_filter"),
                options.get("workflows"),
            )
        )
        del options["workflow_filter"]
    for v in options.get("workflows"):
        assign_options(
            v,
            {
                "suite": options.get("suite"),
                "version": options.get("version"),
                "testcases": options.get("testcases"),
            },
        )
    options.pop("suite", None)
    options.pop("version", None)
    options.pop("testcases", None)


def fetch_remote_options(input, transport: Transport):
    from json import loads

    response = transport.request(method="POST", path="/client/options", body=input)
    if response.status == 401:
        raise ToucaError("auth_invalid_key")
    if response.status == 409:
        raise ToucaError("remote_options_sealed")
    if response.status != 200:
        raise ToucaError("transport_options")
    return loads(response.data.decode("utf-8"))


def apply_remote_options(options: dict, transport: Transport):
    if options.get("offline") or "api_key" not in options or "api_url" not in options:
        return
    workflows: List[dict] = options.get("workflows")
    if not workflows:
        return
    response = fetch_remote_options(
        [
            {
                "team": options.get("team"),
                "suite": v.get("suite"),
                "version": v.get("version"),
                "testcases": v.get("testcases", []),
            }
            for v in workflows
        ],
        transport,
    )
    for v in response:
        w = next(x for x in workflows if x.get("suite") == v.get("suite"))
        if w:
            assign_options(
                w, {"version": v.get("version"), "testcases": v.get("testcases")}
            )


def validate_core_options(options: dict):
    validate_options_type(options, bool, ["concurrency", "offline"])
    validate_options_type(
        options, str, ["api_key", "api_url", "suite", "team", "version"]
    )
    slugs = ["team", "suite", "version"]
    if any(x in options for x in slugs):
        throw_if_missing(options, slugs)
    if not options.get("offline"):
        throw_if_missing(options, ["api_key", "api_url"])
    return (
        False
        if any(options.get(x) for x in slugs) and not all(options.get(x) for x in slugs)
        else True
        if options.get("offline")
        else all(x in options for x in ["api_key", "api_url"])
    )


def validate_runner_options(options: dict):
    validate_options_type(
        options,
        bool,
        [
            "colored_output",
            "concurrency",
            "offline",
            "overwrite_results",
            "save_binary",
            "save_json",
        ],
    )
    validate_options_type(
        options,
        str,
        [
            "api_key",
            "api_url",
            "suite",
            "team",
            "version",
            "workflow_filter",
        ],
    )
    validate_options_type(options, Path, ["output_directory"])
    if not options.get("offline"):
        throw_if_missing(options, ["api_key", "api_url"])
    workflows = options.get("workflows")
    if not workflows:
        raise ToucaError("workflows_missing")
    if not all(w.get("version") for w in workflows):
        raise ToucaError("config_option_missing", "version")
    if not all(w.get("testcases") for w in workflows):
        raise ToucaError("config_option_missing", "testcases")


def update_core_options(options: dict, transport: Transport):
    apply_environment_variables(options)
    apply_api_url(options)
    apply_core_options(options)
    authenticate(options, transport)
    return validate_core_options(options)


def update_runner_options(options: dict, transport: Transport):
    apply_cli_arguments(options)
    apply_config_file(options)
    apply_config_profile(options)
    apply_environment_variables(options)
    apply_api_url(options)
    apply_core_options(options)
    authenticate(options, transport)
    apply_runner_options(options)
    apply_remote_options(options, transport)
    validate_runner_options(options)
