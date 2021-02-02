#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

import argparse
import json
import os
import sys
from jsonschema import validate, Draft3Validator, ValidationError
from loguru import logger

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
    schema_path = make_absolute_path("./profiles/profile.schema.json")

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

@logger.catch
def main():

    # command line arguments

    parser = argparse.ArgumentParser()
    parser.add_argument('profile', type=str, help='path to the profile file')
    args_app, _ = parser.parse_known_args()

    # setup logging

    logger.remove()
    logger.add(sys.stdout, level="INFO", colorize=True, \
        format="<green>{time:HH:mm:ss!UTC}</green> | <cyan>{level: <7}</cyan> | <lvl>{message}</lvl>")
    logger.add("logs/runner_{time:YYMMDD!UTC}.log", level="DEBUG", rotation="1 day", compression="zip")

    # check that profile is a valid json file

    config = profile_parse(os.path.abspath(args_app.profile))
    if not config:
        logger.error("failed to parse profile: {}", args_app.profile)
        return False

    # validate configuration parameters

    if not profile_validate(config):
        logger.error("failed to validate test profile")
        return False

    # check if version is already executed

    archive_dir = make_absolute_path(config["execution"]["archive-dir"], args_app.profile)
    print(archive_dir)

    # find the test version

    # download the artifact

    # install the artifact

    # run the test

    # archive the test results

if __name__ == '__main__':
    main()
