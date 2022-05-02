# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from pathlib import Path
from configparser import ConfigParser


def _apply_legacy_config_file(incoming: dict) -> None:
    from json import loads

    if "file" not in incoming:
        return
    path = Path(incoming.get("file"))
    if not path.is_file():
        raise ValueError("configuration file not found")
    content = path.read_text()
    try:
        parsed = loads(content)
    except ValueError:
        raise ValueError("configuration file has unexpected format")
    if "touca" not in parsed:
        raise ValueError('configuration file is missing JSON field: "touca"')
    for k in parsed["touca"]:
        if k not in incoming:
            incoming[k] = parsed["touca"][k]


def _apply_config_file(incoming: dict) -> None:
    config = config_file_parse()
    if not config or not config.has_section("settings"):
        return
    for key in config.options("settings"):
        if key not in incoming:
            incoming[key] = config.get("settings", key)


def _apply_arguments(existing, incoming: dict) -> None:
    for params, validate in [
        (
            ["team", "suite", "version", "api-key", "api-url"],
            lambda x: isinstance(x, str),
        ),
        (["offline", "concurrency"], lambda x: isinstance(x, bool)),
    ]:
        for param in params:
            if param not in incoming:
                continue
            value = incoming.get(param)
            if not validate(value):
                raise ValueError(f"parameter {param} has unexpected type")
            existing[param] = value


def _apply_environment_variables(existing) -> None:
    from os import environ

    for env, opt in [
        ("TOUCA_API_KEY", "api-key"),
        ("TOUCA_API_URL", "api-url"),
        ("TOUCA_TEST_VERSION", "version"),
    ]:
        if environ.get(env):
            existing[opt] = environ.get(env)


def _reformat_parameters(existing: dict) -> None:
    from urllib.parse import urlparse

    existing.setdefault("concurrency", True)

    api_url = existing.get("api-url")
    if not api_url:
        # existing["api-url"] = "https://api.touca.io"
        return
    url = urlparse(api_url)
    urlpath = [k.strip("/") for k in url.path.split("/@/")]
    existing["api-url"] = f"{url.scheme}://{url.netloc}/{urlpath[0]}".rstrip("/")

    if len(urlpath) == 1:
        return

    slugs = [k for k in urlpath[1].split("/") if k]
    for k, v in list(zip(["team", "suite", "version"], slugs)):
        existing[k] = v


def _validate_options(existing: dict):
    expected_keys = ["team", "suite", "version"]
    has_handshake = not existing.get("offline")
    if has_handshake and any(x in existing for x in ["api-key", "api-url"]):
        expected_keys.extend(["api-key", "api-url"])
    key_status = {k: k in existing for k in expected_keys}
    if any(key_status.values()) and not all(key_status.values()):
        keys = list(filter(lambda x: not key_status[x], key_status))
        raise ValueError(f"missing required option(s) {','.join(keys)}")


def update_options(existing: dict, incoming: dict):
    _apply_legacy_config_file(incoming)
    _apply_config_file(incoming)
    _apply_arguments(existing, incoming)
    _apply_environment_variables(existing)
    _reformat_parameters(existing)
    _validate_options(existing)


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


def config_file_parse() -> ConfigParser:
    path = find_profile_path()
    if path.exists():
        config = ConfigParser()
        config.read_string(path.read_text())
        return config
