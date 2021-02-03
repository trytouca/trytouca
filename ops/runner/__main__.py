#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

import argparse
import json
import os
import shutil
import subprocess
import sys
from jsonschema import validate, Draft3Validator, ValidationError
from loguru import logger
import requests
import tempfile

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
        with open(path, 'rt') as file:
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
    schema_path = make_absolute_path("./config/profile.schema.json")

    schema = parse_json_file(schema_path)
    if not schema:
        logger.warning("failed to profile schema: {}", schema_path)
        return False

    validator = Draft3Validator(schema)
    errors = sorted(validator.iter_errors(config, schema), key=str)
    for error in errors:
        logger.warning("parameter {} in profile has unexpected value: {}",
            ".".join(list(error.relative_path)), error.message)
    return not errors

def find_artifact_version(config: dict) -> str:
    cfg = config["artifactory"]
    fmt = "{base_url}/api/search/latestVersion?g={group}&a={name}&repos={repo}"
    query_url = fmt.format(
        base_url=cfg["base-url"], group=cfg["group"],
        name=cfg["name"], repo=cfg["repo"])
    if "version-filter" in cfg:
        query_url += "&v=" + cfg["version-filter"]
    logger.debug("finding latest version: {}", query_url)
    artifact_version = requests.get(query_url).text
    logger.info("choosing version {}", artifact_version)
    return artifact_version

def build_artifact_download_url(config: dict, version: str) -> str:
    cfg = config["artifactory"]
    path = cfg["installer-msi-url"].format(
        repo=cfg["repo"], group=cfg["group"], name=cfg["name"], version=version)
    return f"{cfg['base-url']}/{path}"

def download_artifact(config: dict, tmpdir, artifact_version) -> str:
    download_url = build_artifact_download_url(config, artifact_version)
    msi_path = os.path.join(tmpdir, download_url.split('/')[-1])
    with open(msi_path, "wb") as tmpfile:
        logger.info("downloading artifact: {}", artifact_version)
        logger.debug("downloading: {}", download_url)
        with requests.get(download_url, stream=True) as response:
            response.raw.decode_content = True
            shutil.copyfileobj(response.raw, tmpfile)
            return msi_path

def install_artifact(config: dict, msi_path: str) -> bool:
    install_location = config["artifactory"]["installer-msi-location"]
    target_option = f"TARGET_DIR=\"{install_location}\""
    cmd = " ".join(["msiexec", "/i", msi_path, "/passive", "/qn", target_option])
    logger.info("installing artifact: {}", install_location)
    logger.debug("installing: {}", cmd)
    try:
        subprocess.check_output(cmd)
    except subprocess.CalledProcessError as err:
        logger.error(err)
        return False
    return True

@logger.catch
def main():

    # command line arguments

    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--profile",
        type=str, help="path to the profile file",
        action="store", required=True, default=None)
    parser.add_argument("-r", "--revision",
        type=str, help="specific version to run",
        action="store", required=False, default=None)
    args_app, _ = parser.parse_known_args()

    # setup logging

    logger.remove()
    logger.add(sys.stdout, level="DEBUG", colorize=True, \
        format="<green>{time:HH:mm:ss!UTC}</green> | <cyan>{level: <7}</cyan> | <lvl>{message}</lvl>")
    logger.add("logs/runner_{time:YYMMDD!UTC}.log", level="DEBUG", rotation="1 day", compression="zip")

    # parse profile_name

    profile_name = os.path.splitext(os.path.basename(os.path.abspath(args_app.profile)))[0]
    logger.debug("running profile: {}", profile_name)

    # check that profile is a valid json file

    config = profile_parse(os.path.abspath(args_app.profile))
    if not config:
        logger.error("failed to parse profile: {}", args_app.profile)
        return False

    # validate configuration parameters

    if not profile_validate(config):
        logger.error("failed to validate test profile")
        return False

    # find version of the test artifact

    artifact_version = find_artifact_version(config) if "revision" in args_app else args_app.revision
    if not artifact_version:
        logger.error("failed to find artifact version: {}", artifact_version)
        return False

    # check if version is already executed

    archive_root = make_absolute_path(config["execution"]["archive-dir"], args_app.profile)
    if os.path.exists(os.path.join(archive_root, profile_name, artifact_version) + ".7z"):
        logger.info("{}/{} is already executed", artifact_version, profile_name)
        return True

    # download and install the test artifact

    with tempfile.TemporaryDirectory(prefix="weasel_runner_artifact") as tmpdir:
        msi_path = download_artifact(config, tmpdir, artifact_version)
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

    logger.info("test complete for {}/{}", config["execution"]["suite"], artifact_version)
    return True

def run_test(config: dict, artifact_version: str):
    install_location = config["artifactory"]["installer-msi-location"]
    cfg = config["execution"]
    test_config_path = os.path.join(install_location, cfg["config"])
    test_executable = os.path.join(install_location, cfg["executable"])
    cmd = [
        test_executable,
        '-c', test_config_path,
        '-r', artifact_version,
        '--suite', cfg["suite"]
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
    cmd = [ 'C:\\Program Files\\7-Zip\\7z.exe', 'a', dst_file, src_dir + '\\*'  ]
    subprocess.run(cmd)
    shutil.rmtree(src_dir)
    return True

if __name__ == '__main__':
    main()
