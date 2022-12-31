# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path
from typing import Dict, List, Union
from touca.cli._common import CliCommand, Operation, invalid_subcommand

logger = logging.getLogger("touca.cli.server")


def check_prerequisites():
    from shutil import which

    requirements = {
        "docker": (
            "We use Docker to install Touca server."
            " We could not find it on your system."
            " Please install docker and try this script again."
            " See https://docs.docker.com/get-docker/ for instructions."
            " Have a great day!"
        ),
        "docker-compose": (
            "We use docker-compose to install Touca server."
            " We could not find it on your system."
            " Please install docker-compose and try this script again."
            " See https://docs.docker.com/compose/install/ for instructions."
            " Have a great day!"
        ),
    }
    for cmd, error in requirements.items():
        if not which(cmd):
            raise RuntimeError(error)


def find_compose_file(install_dir) -> Union[Path, None]:
    return next(install_dir.joinpath("ops").glob("docker-compose.*.yml"), None)


def find_install_dir():
    default_dir = Path.home().joinpath(".touca", "server")
    install_dir = (
        default_dir
        if find_compose_file(default_dir)
        else Path(ask("Where is Touca installed?", default_dir)).expanduser().absolute()
    )
    compose_file = find_compose_file(install_dir)
    if not compose_file:
        raise RuntimeError(f"Touca server is not installed in {install_dir}")
    return install_dir


def uninstall_instance(install_dir: Path):
    from shutil import rmtree

    compose_file = find_compose_file(install_dir)
    if not compose_file:
        return
    logger.info("Stopping running containers")
    if run_compose(compose_file, "stop"):
        raise RuntimeError("failed to stop running containers")
    logger.info("Removing stopped containers")
    if run_compose(compose_file, "down"):
        raise RuntimeError("failed to remove stopped containers")
    for x in ["data", "logs", "ops"]:
        rmtree(install_dir.joinpath(x), ignore_errors=True)


def upgrade_instance(install_dir: Path):
    compose_file = find_compose_file(install_dir)
    logger.info("Updating docker images")
    if run_compose(compose_file, "pull"):
        raise RuntimeError("failed to update docker images")
    logger.info("Starting new containers")
    if run_compose(compose_file, "up", "-d", "--remove-orphans"):
        raise RuntimeError("failed to start new containers")


def ask(question: str, default: str = None):
    from colorama import Style

    msg = f' {Style.DIM}(default is "{default}"){Style.RESET_ALL}' if default else ""
    output = input(f"$ {question}{msg}\n> ")
    return output if output else default if default else ""


def run_external_command(cmd: List[str], envvars: dict = {}):
    from os import environ
    from subprocess import Popen
    from sys import stderr, stdout

    env = environ.copy()
    env.update(envvars)
    proc = Popen(cmd, env=env, universal_newlines=True, stdout=stdout, stderr=stderr)
    return proc.wait()


def run_compose(compose_file: Path, *argv):
    from os import getuid
    from pwd import getpwuid

    user = getpwuid(getuid())
    return run_external_command(
        [
            "docker-compose",
            "-f",
            compose_file,
            "-p",
            "touca",
            "--project-directory",
            compose_file.parent.parent,
            *argv,
        ],
        {"UID_GID": f"{user.pw_uid}:{user.pw_gid}"},
    )


def install_file(install_dir: Path, filepath: str):
    import requests

    dst_file = install_dir.joinpath(filepath)
    dst_file.parent.mkdir(parents=True, exist_ok=True)
    remote = "https://raw.githubusercontent.com/trytouca/trytouca/main"
    response = requests.get(f"{remote}/{filepath}")
    dst_file.write_text(response.text)


def check_server_status(*, attempts=1, port=8080):
    from time import sleep

    import requests

    for attempt in range(1, attempts + 1):
        try:
            response = requests.get(f"http://localhost:{port}/api/platform", timeout=1)
            if response.status_code == 200 and response.json()["ready"]:
                logger.info("Touca server is up and running")
                return True
        except:
            pass
        if 1 < attempts:
            logger.info("Checking... (attempt %d/%d)", attempt, attempts)
            sleep(5)
    return False


class InstallCommand(CliCommand):
    name = "install"
    help = "Install and run a local instance of Touca server"

    @staticmethod
    def parser(parser: ArgumentParser):
        parser.add_argument(
            "--dev",
            action="store_true",
            dest="dev",
            help="Install for development environment",
        )
        parser.add_argument(
            "--install-dir",
            dest="install_dir",
            help="Path to server installation directory",
        )

    @staticmethod
    def run(options: Dict):
        check_prerequisites()
        logger.debug("Installing touca server")
        install_dir = (
            Path(
                options.get("install_dir")
                if options.get("install_dir")
                else ask(
                    "Where should we install Touca?",
                    Path.home().joinpath(".touca", "server"),
                )
            )
            .expanduser()
            .absolute()
        )
        logger.info("Installing into %s", install_dir)

        data_dir = install_dir.joinpath("data")
        if data_dir.exists():
            logger.warning("We found a previous local instance of Touca.")
            response = ask("Are you sure you want to remove it? [y/n]", "yes")
            if response not in ["y", "Y", "yes", "Yes"]:
                raise RuntimeError(
                    "This subcommand is suitable for a fresh install."
                    " Use `touca server upgrade` to upgrade your existing instance."
                    " Have a great day!"
                )
            uninstall_instance(install_dir)

        for x in ["minio", "mongo", "redis"]:
            data_dir.joinpath(x).mkdir(exist_ok=True, parents=True)
        extension = "dev" if options.get("dev") else "prod"
        install_file(install_dir, f"ops/docker-compose.{extension}.yml")
        install_file(install_dir, "ops/mongo/entrypoint/entrypoint.js")
        install_file(install_dir, "ops/mongo/mongod.conf")
        upgrade_instance(install_dir)
        if not options.get("dev") and not check_server_status(attempts=10, port=8080):
            raise RuntimeError(
                "Touca server did not pass our health checks in time."
                " It may be down or misconfigured."
                " Try running 'touca server logs' to learn more."
            )
        if not options.get("dev"):
            logger.info("Go to http://localhost:8080/ to complete the installation")


class LogsCommand(CliCommand):
    name = "logs"
    help = "Show touca server logs"

    @staticmethod
    def parser(parser: ArgumentParser):
        parser.add_argument(
            "--follow",
            dest="follow",
            const=True,
            default=False,
            nargs="?",
            help="Follow log output",
        )

    @staticmethod
    def run(options: Dict):
        check_prerequisites()
        if not check_server_status():
            raise RuntimeError("Touca server appears to be down")
        default_dir = Path.home().joinpath(".touca", "server")
        compose_file = find_compose_file(default_dir)
        if not compose_file:
            raise RuntimeError(f"Touca server is not installed in {default_dir}")
        arguments = (
            ["logs", "--follow", "--tail", "1000", "touca_touca"]
            if options.get("follow", False)
            else ["logs", "--tail", "1000", "touca_touca"]
        )
        run_compose(compose_file, *arguments)


class StatusCommand(CliCommand):
    name = "status"
    help = "Show the status of a locally running instance of Touca server"

    @staticmethod
    def run(options: Dict):
        if not check_server_status():
            raise RuntimeError("Touca server appears to be down")


class UninstallCommand(CliCommand):
    name = "uninstall"
    help = "Uninstall and remove your local instance of Touca server"

    @staticmethod
    def run(_):
        check_prerequisites()
        logger.info("Uninstalling touca server")
        install_dir = find_install_dir()
        logger.info("Uninstalling %s", install_dir)
        uninstall_instance(install_dir)


class UpgradeCommand(CliCommand):
    name = "upgrade"
    help = "Upgrade your local instance of Touca server to the latest version"

    @staticmethod
    def run(_):
        check_prerequisites()
        logger.info("Upgrading touca server")
        install_dir = find_install_dir()
        logger.info("Upgrading %s", install_dir)
        upgrade_instance(install_dir)


class ServerCommand(Operation):
    name = "server"
    help = "Install and manage your Touca server"
    subcommands: List[CliCommand] = [
        InstallCommand,
        LogsCommand,
        StatusCommand,
        UninstallCommand,
        UpgradeCommand,
    ]

    @classmethod
    def parser(self, parser: ArgumentParser):
        parsers = parser.add_subparsers(dest="subcommand")
        for cmd in ServerCommand.subcommands:
            cmd.parser(parsers.add_parser(cmd.name, help=cmd.help))

    def __init__(self, options: dict):
        self.__options = options

    def run(self) -> bool:
        command = self.__options.get("subcommand")
        if not command:
            return invalid_subcommand(ServerCommand)
        subcommand = next(i for i in ServerCommand.subcommands if i.name == command)
        if not subcommand:
            return invalid_subcommand(ServerCommand)
        try:
            subcommand.run(self.__options)
            return True
        except RuntimeError as err:
            logger.error(err)
        except KeyboardInterrupt:
            print()
        return False
