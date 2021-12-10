# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.


def _apply_config_file(incoming: dict) -> None:
    """ """
    from json import loads
    from os.path import isfile

    path = incoming.get("file")
    if not path:
        return
    if not isfile(path):
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
    """ """
    for params, validate in [
        (
            ["team", "suite", "version", "api_key", "api_url"],
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
    """ """
    from os import environ

    for env, opt in [
        ("TOUCA_API_KEY", "api_key"),
        ("TOUCA_API_URL", "api_url"),
        ("TOUCA_TEST_VERSION", "version"),
    ]:
        if environ.get(env):
            existing[opt] = environ.get(env)


def _reformat_parameters(existing: dict) -> None:
    """ """
    from urllib.parse import urlparse

    existing.setdefault("concurrency", True)

    api_url = existing.get("api_url")
    if not api_url:
        return
    url = urlparse(api_url)
    urlpath = [k.strip("/") for k in url.path.split("/@/")]
    existing["api_url"] = f"{url.scheme}://{url.netloc}/{urlpath[0]}".rstrip("/")

    if len(urlpath) == 1:
        return

    slugs = [k for k in urlpath[1].split("/") if k]
    for k, v in list(zip(["team", "suite", "version"], slugs)):
        if k in existing and existing.get(k) != v:
            raise ValueError(f"option {k} is in conflict with provided api_url")
        existing[k] = v


def _validate_options(existing: dict) -> None:
    """ """
    expected_keys = ["team", "suite", "version"]
    has_handshake = not existing.get("offline")
    if has_handshake and any(x in existing for x in ["api_key", "api_url"]):
        expected_keys.extend(["api_key", "api_url"])
    key_status = {k: k in existing for k in expected_keys}
    if any(key_status.values()) and not all(key_status.values()):
        keys = list(filter(lambda x: not key_status[x], key_status))
        raise ValueError(f"missing required option(s) {','.join(keys)}")


def update_options(existing: dict, incoming: dict) -> None:
    """ """
    _apply_config_file(incoming)
    _apply_arguments(existing, incoming)
    _apply_environment_variables(existing)
    _reformat_parameters(existing)
    _validate_options(existing)
