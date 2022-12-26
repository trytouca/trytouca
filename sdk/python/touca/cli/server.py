# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path

from touca.cli._common import Operation, invalid_subcommand
from typing import List, Union

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
    from pwd import getpwuid
    from os import getuid

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
    import requests
    from time import sleep

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


class Server(Operation):
    name = "server"
    help = "Install and manage your Touca server"

    @classmethod
    def parser(self, parser: ArgumentParser):
        parsers = parser.add_subparsers(dest="subcommand")
        parser_install = parsers.add_parser(
            "install",
            description="Install touca server",
            help="Install and run a local instance of Touca server",
        )
        parser_install.add_argument(
            "--dev",
            action="store_true",
            dest="dev",
            help="Install for development environment",
        )
        parser_install.add_argument(
            "--install-dir",
            dest="install_dir",
            help="Path to server installation directory",
        )
        parser_logs = parsers.add_parser(
            "logs",
            description="Show touca server logs",
            help="Show Touca server logs",
        )
        parser_logs.add_argument(
            "--follow",
            dest="follow",
            const=True,
            default=False,
            nargs="?",
            help="Follow log output",
        )
        parsers.add_parser(
            "status",
            description="Report touca server status",
            help="Show the status of a locally running instance of Touca server",
        )
        parsers.add_parser(
            "upgrade",
            description="Upgrade touca server",
            help="Upgrade your local instance of Touca server to the latest version",
        )
        parsers.add_parser(
            "uninstall",
            description="Uninstall touca server",
            help="Uninstall and remove your local instance of Touca server",
        )

    def __init__(self, options: dict):
        self.__options = options

    def _command_install(self):
        check_prerequisites()
        logger.debug("Installing touca server")
        install_dir = (
            Path(
                self.__options.get("install_dir")
                if self.__options.get("install_dir")
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
        extension = "dev" if self.__options.get("dev") else "prod"
        install_file(install_dir, f"ops/docker-compose.{extension}.yml")
        install_file(install_dir, "ops/mongo/entrypoint/entrypoint.js")
        install_file(install_dir, "ops/mongo/mongod.conf")
        upgrade_instance(install_dir)
        if not self.__options.get("dev") and not check_server_status(
            attempts=10, port=8080
        ):
            raise RuntimeError(
                "Touca server did not pass our health checks in time."
                " It may be down or misconfigured."
                " Try running 'touca server logs' to learn more."
            )
        if not self.__options.get("dev"):
            logger.info("Go to http://localhost:8080/ to complete the installation")
        return True

    def _command_logs(self):
        check_prerequisites()
        if not check_server_status():
            raise RuntimeError("Touca server appears to be down")
        default_dir = Path.home().joinpath(".touca", "server")
        compose_file = find_compose_file(default_dir)
        if not compose_file:
            raise RuntimeError(f"Touca server is not installed in {default_dir}")
        arguments = (
            ["logs", "--follow", "--tail", "1000", "touca_touca"]
            if self.__options.get("follow", False)
            else ["logs", "--tail", "1000", "touca_touca"]
        )
        run_compose(compose_file, *arguments)

    def _command_status(self):
        if not check_server_status():
            raise RuntimeError("Touca server appears to be down")
        return True

    def _command_uninstall(self):
        check_prerequisites()
        logger.info("Uninstalling touca server")
        install_dir = find_install_dir()
        logger.info("Uninstalling %s", install_dir)
        uninstall_instance(install_dir)
        return True

    def _command_upgrade(self):
        check_prerequisites()
        logger.info("Upgrading touca server")
        install_dir = find_install_dir()
        logger.info("Upgrading %s", install_dir)
        upgrade_instance(install_dir)
        return True

    def run(self) -> bool:
        commands = {
            "install": self._command_install,
            "logs": self._command_logs,
            "status": self._command_status,
            "uninstall": self._command_uninstall,
            "upgrade": self._command_upgrade,
        }
        command = self.__options.get("subcommand")
        if not command:
            return invalid_subcommand(Server)
        if command in commands:
            try:
                return commands.get(command)()
            except RuntimeError as err:
                logger.error(err)
            except KeyboardInterrupt:
                print()
        return False
