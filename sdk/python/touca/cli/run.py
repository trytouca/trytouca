# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path
from typing import Dict

from touca._printer import console
from touca.cli.common import CliCommand

logger = logging.getLogger("touca.cli.run")


class Config:
    def __init__(self, path: str, version: str):
        self.version = version
        self.path = Path(path).resolve()
        self._config = _parse_config(self.path)
        _apply_environment_variables(self._config)
        self.suite = self.get("execution", "suite")

    def get(self, *key):
        def _get(d: Dict, k):
            v = d.get(k[0])
            return v if not v or len(k) == 1 else _get(v, k[1:])

        return _get(self._config, key)

    def get_as_absolute_path(self, *key):
        return self.path.parent.parent.joinpath(
            Path(self.get(*key)).expanduser()
        ).resolve()

    def get_archive_path(self):
        return self.get_as_absolute_path("archive", "dir").joinpath(
            self.suite, f"{self.version}.tar.gz"
        )

    def get_download_path(self):
        return self.path.parent.parent.joinpath(
            "download", self.suite, f"{self.version}.tar.gz"
        )

    def get_extracted_path(self):
        return self.path.parent.parent.joinpath("extracted", self.suite, self.version)


def download_artifact(config: Config):
    from certifi import where
    from urllib3 import make_headers
    from urllib3.poolmanager import PoolManager
    from urllib3.response import HTTPResponse

    logging.getLogger("urllib3").setLevel(logging.WARNING)

    artifactory: dict = config.get("artifactory")
    url = artifactory["artifact_url"].format_map(
        {"version": config.version, **artifactory}
    )
    target_file = config.get_download_path()
    target_file.parent.mkdir(parents=True, exist_ok=True)
    logger.debug(f"downloading artifact {url} into {target_file}")

    http = PoolManager(cert_reqs="CERT_REQUIRED", ca_certs=where())
    basic_auth = [config.get("artifactory", x) for x in ["username", "password"]]
    headers = make_headers(basic_auth=":".join(basic_auth)) if all(basic_auth) else {}
    response: HTTPResponse = http.request(method="GET", url=url, headers=headers)
    if response.status != 200:
        raise RuntimeError(f"failed to fetch artifact: {response.status}")
    target_file.write_bytes(response.data)


def extract_artifact(config: Config):
    from touca.cli.results.extract import extract

    src_file = config.get_download_path()
    dst_dir = config.get_extracted_path()
    logger.debug(f"extracting {src_file} into {dst_dir}")
    extract(src_file, dst_dir)
    logger.debug(f"removing {src_file}")
    _remove_dir(src_file)


def install_artifact(config: Config):
    extracted_path = config.get_extracted_path()
    installer_path = extracted_path.joinpath(config.get("install", "installer"))
    _run_cmd(installer_path)
    _remove_dir(extracted_path)


def run_test(config: Config):
    install_path = config.get_as_absolute_path("install", "destination")
    executable = install_path.joinpath(config.get("execution", "executable"))
    output_dir = config.get_as_absolute_path("execution", "output-directory")
    _run_cmd(
        executable,
        "--revision",
        config.version,
        "--output-directory",
        output_dir,
        "--suite",
        config.suite,
        "--save-as-binary",
    )
    if not config.get("install", "keep"):
        _remove_dir(install_path)


def compress_results(config: Config):
    from touca.cli.results.compress import compress

    output_dir = config.get_as_absolute_path("execution", "output-directory")
    src_dir = output_dir.joinpath(config.suite, config.version)
    dst_file = config.get_archive_path()
    dst_file.parent.mkdir(parents=True, exist_ok=True)
    logger.debug("compressing %s into %s", src_dir, dst_file)
    compress(src_dir, dst_file)
    logger.debug("removing %s", src_dir)
    _remove_dir(src_dir)


def step(name: str, func, *args):
    from rich.theme import Theme

    logger.debug("%s", name)
    try:
        func(*args)
    except Exception:
        with console.use_theme(theme=Theme(), inherit=True):
            console.print_exception()
        raise RuntimeError(f"failed to {name}")


class RunCommand(CliCommand):
    name = "run"
    help = "Run tests on a dedicated test server"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument(
            "-p",
            "--profile",
            type=str,
            help="path to a configuration profile",
            action="store",
            required=True,
        )
        parser.add_argument(
            "-r",
            "--revision",
            type=str,
            help="specific version to run",
            action="store",
            required=False,
        )

    def run(self):
        config = Config(path=self.options["profile"], version=self.options["revision"])

        if config.get_archive_path().exists():
            logger.info("%s/%s is already executed", config.suite, config.version)
            return

        step("download artifact", download_artifact, config)
        step("extract artifact", extract_artifact, config)
        step("install artifact", install_artifact, config)
        step("run the test", run_test, config)
        step("archive test results", compress_results, config)


def _merge_dicts(source: dict, target: dict):
    """utility function that merges a given dictionary into another."""
    for key, value in source.items():
        if isinstance(value, dict):
            node = target.setdefault(key, {})
            _merge_dicts(value, node)
        else:
            target[key] = value


def _parse_config(path: Path):
    from json import loads

    if not path.exists():
        raise RuntimeError(f"config does not exit: {path}")
    content: dict = loads(path.read_text())
    if "extends" in content:
        parent_path = path.parent.joinpath(content["extends"]).resolve()
        parent = _parse_config(parent_path)
        del content["extends"]
        _merge_dicts(parent, content)
    return content


def _apply_environment_variables(options: Dict):
    from os import environ

    envs = map(
        environ.get, ["JFROG_ARTIFACTORY_USERNAME", "JFROG_ARTIFACTORY_PASSWORD"]
    )
    credentials = {k: v for k, v in zip(["username", "password"], envs) if v}
    if credentials:
        _merge_dicts({"artifactory": credentials}, options)


def _run_cmd(*cmd):
    from subprocess import Popen
    from sys import stderr, stdout

    proc = Popen(cmd, stderr=stderr, stdout=stdout)
    proc.wait()


def _remove_dir(path: Path):
    from shutil import rmtree

    if path.exists() and path.is_file():
        path.unlink()
    if path.exists() and path.is_dir():
        rmtree(path)
    if not any(path.parent.iterdir()):
        path.parent.rmdir()
    if not any(path.parent.parent.iterdir()):
        path.parent.parent.rmdir()
