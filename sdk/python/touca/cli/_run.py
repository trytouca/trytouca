# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import json
import shutil
import subprocess
import tempfile
from argparse import ArgumentParser
from pathlib import Path
from urllib.parse import urlencode

import requests
from jsonschema import Draft3Validator
from loguru import logger
from touca.cli._common import Operation


def merge_dict(source: dict, destination: dict):
    for key, value in source.items():
        if isinstance(value, dict):
            node = destination.setdefault(key, {})
            merge_dict(value, node)
        else:
            destination[key] = value


def make_absolute_path(path: Path, base: Path = None) -> Path:
    if path.is_absolute():
        return path
    if not base:
        base = Path(__file__).resolve().parent
    if base.is_file():
        base = base.parent
    return base.joinpath(path).absolute()


def parse_json_file(path: Path) -> dict:
    logger.debug("parsing json file: {}", path)

    # check that the file exists
    if not path.exists():
        logger.warning("failed to find file: {}", path)
        return False

    # load file into memory, validate its format and parse its content
    try:
        return json.loads(path.read_text())
    except OSError as err:
        logger.warning("failed to read file: {}: {}", path, err)
    except ValueError as err:
        logger.warning("failed to parse file: {}: {}", path, err)

    return {}


def profile_parse(profile: Path) -> dict:
    logger.debug("parsing profile: {}", profile)

    # parse profile
    config = parse_json_file(profile)
    if not config:
        logger.warning("failed to parse profile: {}", profile)
        return {}

    # if file extends a template, parse that template
    if "extends" in config:
        parent_file = make_absolute_path(Path(config["extends"]), profile)
        parent_config = profile_parse(parent_file)
        if not parent_config:
            logger.debug("failed to parse template: {}", parent_file)
            return {}
        del config["extends"]
        merge_dict(parent_config, config)

    return config


def profile_validate(config: dict) -> list:
    schema_path = make_absolute_path(Path("./config/profile.schema.json"))
    schema = parse_json_file(schema_path)
    if not schema:
        logger.warning("failed to profile schema: {}", schema_path)
        return False

    validator = Draft3Validator(schema)
    errors = sorted(validator.iter_errors(config, schema), key=str)
    for error in errors:
        logger.warning(
            "parameter {} in profile has unexpected value: {}",
            ".".join(list(error.relative_path)),
            error.message,
        )
    return not errors


def find_artifact_version(config: dict) -> str:
    cfg = config["artifactory"]
    params = {
        "g": cfg["group"],
        "a": cfg["name"],
        "repos": cfg["repo"],
    }
    if "version-filter" in cfg:
        params.update("v", cfg["version-filter"])
    query_url = cfg["base-url"] + "/api/search/latestVersion?" + urlencode(params)
    logger.debug("finding latest version: {}", query_url)
    artifact_version = requests.get(query_url).text
    logger.info("choosing version {}", artifact_version)
    return artifact_version


def build_artifact_download_url(config: dict, version: str) -> str:
    cfg = config["artifactory"]
    path = cfg["installer-msi-url"].format(
        repo=cfg["repo"], group=cfg["group"], name=cfg["name"], version=version
    )
    return f"{cfg['base-url']}/{path}"


def download_artifact(config: dict, tmpdir: Path, artifact_version) -> str:
    download_url = build_artifact_download_url(config, artifact_version)
    msi_path = tmpdir.joinpath(download_url.split("/")[-1])
    with open(msi_path, "wb") as tmpfile:
        logger.info("downloading artifact: {}", artifact_version)
        logger.debug("downloading: {}", download_url)
        with requests.get(download_url, stream=True) as response:
            response.raw.decode_content = True
            shutil.copyfileobj(response.raw, tmpfile)
            return msi_path


def install_artifact(config: dict, msi_path: str) -> bool:
    install_location = config["artifactory"]["installer-msi-location"]
    target_option = f'TARGET_DIR="{install_location}"'
    cmd = " ".join(["msiexec", "/i", msi_path, "/passive", "/qn", target_option])
    logger.info("installing artifact: {}", install_location)
    logger.debug("installing: {}", cmd)
    try:
        subprocess.check_output(cmd)
    except subprocess.CalledProcessError as err:
        logger.error(err)
        return False
    return True


def run_test(config: dict, artifact_version: str):
    install_location = Path(config["artifactory"]["installer-msi-location"])
    test_config_path = install_location.joinpath(config["execution"]["config"])
    test_executable = install_location.joinpath(config["execution"]["executable"])
    cmd = [
        test_executable,
        "-c",
        test_config_path,
        "-r",
        artifact_version,
        "--suite",
        config["execution"]["suite"],
    ]
    subprocess.run(cmd)
    return True


def archive_results(config: dict, artifact_version: str):
    install_location = Path(config["artifactory"]["installer-msi-location"])
    test_config_path = install_location.joinpath(config["execution"]["config"])
    test_config = parse_json_file(test_config_path)
    output_dir = Path(test_config["framework"]["output-dir"])
    src_dir = output_dir.joinpath(config["execution"]["suite"], artifact_version)
    dst_file = (
        Path(config["execution"]["archive-dir"])
        .joinpath(config["execution"]["suite"], artifact_version)
        .with_suffix(".7z")
    )
    cmd = ["C:\\Program Files\\7-Zip\\7z.exe", "a", dst_file, src_dir + "\\*"]
    subprocess.run(cmd)
    shutil.rmtree(src_dir)
    return True


class Run(Operation):
    name = "run"
    help = "Run regression test on a dedicated test server"

    def __init__(self, options: dict):
        self.__options = options

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument(
            "-p",
            "--profile",
            type=str,
            help="path to the profile file",
            action="store",
            required=True,
            default=None,
        )
        parser.add_argument(
            "-r",
            "--revision",
            type=str,
            help="specific version to run",
            action="store",
            required=False,
            default=None,
        )
        return parser

    def run(self):
        profile_path = Path(self.__options.get("profile"))

        # parse profile_name

        profile_name = profile_path.absolute().stem
        logger.debug("running profile: {}", profile_name)

        # check that profile is a valid json file

        config = profile_parse(profile_path.absolute())
        if not config:
            logger.error("failed to parse profile: {}", profile_path)
            return False

        # validate configuration parameters

        if not profile_validate(config):
            logger.error("failed to validate test profile")
            return False

        # find version of the test artifact

        artifact_version = (
            find_artifact_version(config)
            if "revision" in self.__options
            else self.__options.get("revision")
        )
        if not artifact_version:
            logger.error("failed to find artifact version: {}", artifact_version)
            return False

        # check if version is already executed

        archive_root = make_absolute_path(
            Path(config["execution"]["archive-dir"]), profile_path
        )
        if (
            archive_root.joinpath(profile_name, artifact_version)
            .with_suffix(".7z")
            .exist()
        ):
            logger.info("{}/{} is already executed", artifact_version, profile_name)
            return True

        # download and install the test artifact

        with tempfile.TemporaryDirectory(prefix="touca_runner_artifact") as tmpdir:
            msi_path = download_artifact(config, Path(tmpdir), artifact_version)
            if not msi_path:
                logger.error("failed to download artifact: {}", artifact_version)
                return False
            if not install_artifact(config, msi_path):
                logger.error("failed to install artifact: {}", artifact_version)
                return False

        # run the test on a separate thread

        if not run_test(config, artifact_version):
            logger.error("failed to run the test")
            return False

        # archive the test results

        if not archive_results(config, artifact_version):
            logger.error("failed to archive test results")
            return False

        logger.info(
            "test complete for {}/{}", config["execution"]["suite"], artifact_version
        )
        return True
