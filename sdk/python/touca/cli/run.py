# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import json
import logging
import os
import shutil
import subprocess
import tempfile
from argparse import ArgumentParser

from touca.cli.common import CliCommand

logger = logging.getLogger("touca.cli.run")


def merge_dict(source: dict, destination: dict):
    for key, value in source.items():
        if isinstance(value, dict):
            node = destination.setdefault(key, {})
            merge_dict(value, node)
        else:
            destination[key] = value


def make_absolute_path(path: str, base: str = None) -> str:
    if os.path.isabs(path):
        return path
    if not base:
        base = os.path.dirname(os.path.realpath(__file__))
    if os.path.isfile(base):
        base = os.path.dirname(base)
    return os.path.abspath(os.path.join(base, path))


def parse_json_file(path: str) -> dict:
    logger.debug("parsing json file: {}", path)

    # check that the file exists
    if not os.path.exists(path):
        logger.warning("failed to find file: {}", path)
        return False

    # load file into memory, validate its format and parse its content
    try:
        with open(path, "rt") as file:
            data = file.read()
        return json.loads(data)
    except OSError as err:
        logger.warning("failed to read file: {}: {}", path, err)
    except ValueError as err:
        logger.warning("failed to parse file: {}: {}", path, err)

    return {}


def profile_parse(profile_path: str) -> dict:
    logger.debug("parsing profile: {}", profile_path)

    # parse profile
    config = parse_json_file(profile_path)
    if not config:
        logger.warning("failed to parse profile: {}", profile_path)
        return {}

    # if file extends a template, parse that template
    if "extends" in config:
        parent_file = make_absolute_path(config["extends"], profile_path)
        parent_config = profile_parse(parent_file)
        if not parent_config:
            logger.debug("failed to parse template: {}", parent_file)
            return {}
        del config["extends"]
        merge_dict(parent_config, config)

    return config


def profile_validate(config: dict) -> list:
    from jsonschema import Draft3Validator

    schema_path = make_absolute_path("./config/profile.schema.json")
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
    import requests

    cfg = config["artifactory"]
    fmt = "{base_url}/api/search/latestVersion?g={group}&a={name}&repos={repo}"
    query_url = fmt.format(
        base_url=cfg["base-url"], group=cfg["group"], name=cfg["name"], repo=cfg["repo"]
    )
    if "version-filter" in cfg:
        query_url += "&v=" + cfg["version-filter"]
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


def download_artifact(config: dict, tmpdir, artifact_version) -> str:
    import requests

    download_url = build_artifact_download_url(config, artifact_version)
    msi_path = os.path.join(tmpdir, download_url.split("/")[-1])
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
    install_location = config["artifactory"]["installer-msi-location"]
    cfg = config["execution"]
    test_config_path = os.path.join(install_location, cfg["config"])
    test_executable = os.path.join(install_location, cfg["executable"])
    cmd = [
        test_executable,
        "-c",
        test_config_path,
        "-r",
        artifact_version,
        "--suite",
        cfg["suite"],
    ]
    subprocess.run(cmd)
    return True


def archive_results(config: dict, artifact_version: str):
    install_location = config["artifactory"]["installer-msi-location"]
    cfg = config["execution"]
    test_config_path = os.path.join(install_location, cfg["config"])
    test_config = parse_json_file(test_config_path)
    output_dir = test_config["framework"]["output-dir"]
    src_dir = os.path.join(output_dir, cfg["suite"], artifact_version)
    dst_file = os.path.join(cfg["archive-dir"], cfg["suite"], artifact_version) + ".7z"
    cmd = ["C:\\Program Files\\7-Zip\\7z.exe", "a", dst_file, src_dir + "\\*"]
    subprocess.run(cmd)
    shutil.rmtree(src_dir)
    return True


class RunCommand(CliCommand):
    name = "run"
    help = "Run tests on a dedicated test server"

    @classmethod
    def parser(cls, parser: ArgumentParser):
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

    def run(self):
        profile_path = self.options.get("profile")

        # parse profile_name

        profile_name = os.path.splitext(
            os.path.basename(os.path.abspath(profile_path))
        )[0]
        logger.debug("running profile: {}", profile_name)

        # check that profile is a valid json file

        config = profile_parse(os.path.abspath(profile_path))
        if not config:
            raise RuntimeError(f"failed to parse profile: {profile_path}")

        # validate configuration parameters
        if not profile_validate(config):
            raise RuntimeError("failed to validate test profile")

        # find version of the test artifact

        artifact_version = (
            find_artifact_version(config)
            if "revision" not in self.options
            else self.options.get("revision")
        )
        if not artifact_version:
            raise RuntimeError(f"failed to find artifact version: {artifact_version}")

        # check if version is already executed

        archive_root = make_absolute_path(
            config["execution"]["archive-dir"], profile_path
        )
        if os.path.exists(
            os.path.join(archive_root, profile_name, artifact_version) + ".7z"
        ):
            logger.info("{}/{} is already executed", artifact_version, profile_name)
            return

        # download and install the test artifact
        with tempfile.TemporaryDirectory(prefix="touca_runner_artifact") as tmpdir:
            msi_path = download_artifact(config, tmpdir, artifact_version)
            if not msi_path:
                raise RuntimeError(f"failed to download artifact: {artifact_version}")
            if not install_artifact(config, msi_path):
                raise RuntimeError(f"failed to install artifact: {artifact_version}")

        # run the test on a separate thread
        if not run_test(config, artifact_version):
            raise RuntimeError("failed to run the test")

        # archive the test result
        if not archive_results(config, artifact_version):
            raise RuntimeError("failed to archive test results")

        logger.info(
            "test complete for {}/{}", config["execution"]["suite"], artifact_version
        )
