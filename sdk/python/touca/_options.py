# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import os
from pathlib import Path
from configparser import ConfigParser


def _apply_config_file(incoming: dict) -> None:
    from json import loads

    path = incoming.get("file")
    if not path:
        return
    if not os.path.isfile(path):
        raise ValueError("file not found")
    with open(path, "rt") as file:
        content = file.read()
        try:
            parsed = loads(content)
        except ValueError:
            raise ValueError("file has unexpected format")
    if "touca" not in parsed:
        raise ValueError('file is missing JSON field: "touca"')
    for k in parsed["touca"]:
        if k not in incoming:
            incoming[k] = parsed["touca"][k]


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
    for env, opt in [
        ("TOUCA_API_KEY", "api-key"),
        ("TOUCA_API_URL", "api-url"),
        ("TOUCA_TEST_VERSION", "version"),
    ]:
        if os.environ.get(env):
            existing[opt] = os.environ.get(env)


def _reformat_parameters(existing: dict) -> None:
    from urllib.parse import urlparse

    existing.setdefault("concurrency", True)

    api_url = existing.get("api-url")
    if not api_url:
        return
    url = urlparse(api_url)
    urlpath = [k.strip("/") for k in url.path.split("/@/")]
    existing["api-url"] = f"{url.scheme}://{url.netloc}/{urlpath[0]}".rstrip("/")

    if len(urlpath) == 1:
        return

    slugs = [k for k in urlpath[1].split("/") if k]
    for k, v in list(zip(["team", "suite", "version"], slugs)):
        if k in existing and existing.get(k) != v:
            raise ValueError(f"option {k} is in conflict with provided api_url")
        existing[k] = v


def _validate_options(existing: dict) -> None:
    expected_keys = ["team", "suite", "version"]
    has_handshake = not existing.get("offline")
    if has_handshake and any(x in existing for x in ["api-key", "api-url"]):
        expected_keys.extend(["api-key", "api-url"])
    key_status = {k: k in existing for k in expected_keys}
    if any(key_status.values()) and not all(key_status.values()):
        keys = list(filter(lambda x: not key_status[x], key_status))
        raise ValueError(f"missing required option(s) {','.join(keys)}")


def update_options(existing: dict, incoming: dict) -> None:
    _apply_config_file(incoming)
    _apply_arguments(existing, incoming)
    _apply_environment_variables(existing)
    _reformat_parameters(existing)
    _validate_options(existing)


def config_file_home() -> str:
    app_dir = os.path.join(os.getcwd(), ".touca")
    if os.path.exists(app_dir):
        return app_dir
    return os.path.join(Path.home(), ".touca")


def config_file_load() -> str:
    config_file_path = os.path.join(config_file_home(), "profiles", "default")
    if not os.path.exists(config_file_path):
        return ""
    with open(config_file_path, "rt") as config_file:
        return config_file.read().strip()


def config_file_parse():
    file_content = config_file_load()
    if not file_content:
        return
    config = ConfigParser()
    config.read_string(file_content)
    return config


def config_file_get(key: str) -> str:
    config = config_file_parse()
    if config and config.has_option("settings", key):
        return config.get("settings", key)
    return ""


def config_file_set(key: str, value: str, section="settings") -> None:
    config_file_path = Path(config_file_home(), "profiles", "default")
    os.makedirs(config_file_path.parent, exist_ok=True)
    config = ConfigParser()
    if os.path.exists(config_file_path):
        with open(config_file_path, "rt") as config_file:
            config.read_string(config_file.read())
    if not config.has_section(section):
        config.add_section(section)
    config.set(section, key, value)
    with open(config_file_path, "wt") as config_file:
        config.write(config_file)


def config_file_remove(key: str) -> None:
    config_file_path = Path(config_file_home(), "profiles", "default")
    config = config_file_parse()
    if config and config.has_option("settings", key):
        config.remove_option("settings", key)
    with open(config_file_path, "wt") as config_file:
        config.write(config_file)
