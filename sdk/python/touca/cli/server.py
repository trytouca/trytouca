# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import logging
from argparse import ArgumentParser
from pathlib import Path

from touca.cli.common import CliCommand

logger = logging.getLogger("touca.cli.server")


def _get_uid_gid():
    from os import getuid
    from pwd import getpwuid

    user = getpwuid(getuid())
    return f"{user.pw_uid}:{user.pw_gid}"


class Compose:
    def __init__(self):
        from shutil import which
        from subprocess import DEVNULL, Popen

        cmd = "docker compose version".split()
        if Popen(cmd, stdout=DEVNULL, stderr=DEVNULL).wait() == 0:
            self.docker_compose_exec = "docker compose"
            return
        self.docker_compose_exec = "docker-compose"
        if not which("docker"):
            raise RuntimeError(
                "We use Docker to install Touca server."
                " We could not find it on your system."
                " Please install docker and try this script again."
                " See https://docs.docker.com/get-docker/ for instructions."
                " Have a great day!"
            )
        if not which("docker-compose"):
            raise RuntimeError(
                "We use docker compose to install Touca server."
                " We could not find it on your system."
                " Please install docker compose and try this script again."
                " See https://docs.docker.com/compose/install/ for instructions."
                " Have a great day!"
            )

    def run(self, compose_file: Path, *argv):
        from os import environ, name
        from subprocess import Popen
        from sys import stderr, stdout

        env = environ.copy()
        env.update({"UID_GID": "root" if name == "nt" else _get_uid_gid()})
        cmd = [
            *self.docker_compose_exec.split(),
            "-f",
            compose_file,
            "-p",
            "touca",
            "--project-directory",
            compose_file.parent.parent,
            *argv,
        ]
        proc = Popen(
            cmd, env=env, universal_newlines=True, stdout=stdout, stderr=stderr
        )
        return proc.wait()


def find_compose_file(install_dir: Path):
    return next(install_dir.joinpath("ops").glob("docker-compose.*.yml"), None)


def find_install_dir():
    default_dir = Path.home().joinpath(".touca", "server")
    install_dir = (
        default_dir
        if find_compose_file(default_dir)
        else Path(ask("Where is Touca installed?", default_dir)).expanduser().absolute()
    )
    if not find_compose_file(install_dir):
        raise RuntimeError(f"Touca server is not installed in {install_dir}")
    return install_dir


def uninstall_instance(compose: Compose, install_dir: Path):
    from shutil import rmtree

    compose_file = find_compose_file(install_dir)
    if not compose_file:
        return
    logger.info("Stopping running containers")
    if compose.run(compose_file, "stop"):
        raise RuntimeError("failed to stop running containers")
    logger.info("Removing stopped containers")
    if compose.run(compose_file, "down"):
        raise RuntimeError("failed to remove stopped containers")
    for x in ["data", "logs", "ops"]:
        rmtree(install_dir.joinpath(x), ignore_errors=True)


def upgrade_instance(compose: Compose, install_dir: Path):
    compose_file = find_compose_file(install_dir)
    logger.info("Updating docker images")
    if compose.run(compose_file, "pull"):
        raise RuntimeError("failed to update docker images")
    logger.info("Starting new containers")
    if compose.run(compose_file, "up", "-d", "--remove-orphans"):
        raise RuntimeError("failed to start new containers")


def ask(question: str, default: str = None):
    from colorama import Style

    msg = f' {Style.DIM}(default is "{default}"){Style.RESET_ALL}' if default else ""
    try:
        output = input(f"$ {question}{msg}\n> ")
    except KeyboardInterrupt:
        raise RuntimeError()
    return output if output else default if default else ""


def install_file(install_dir: Path, filepath: str):
    from urllib.request import urlopen

    dst_file = install_dir.joinpath(filepath)
    dst_file.parent.mkdir(parents=True, exist_ok=True)
    remote = "https://raw.githubusercontent.com/trytouca/trytouca/main"
    with urlopen(f"{remote}/{filepath}") as response:
        dst_file.write_bytes(response.read())


def check_server_status(*, attempts=1, port=8080):
    from json import loads
    from time import sleep
    from urllib.request import urlopen

    for attempt in range(1, attempts + 1):
        try:
            with urlopen(
                f"http://localhost:{port}/api/platform", timeout=1
            ) as response:
                if response.getcode() == 200 and loads(response.read())["ready"]:
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

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument(
            "--dev",
            action="store_true",
            dest="dev",
            help="Install for development environment",
        )
        parser.add_argument(
            "--test",
            action="store_true",
            dest="test",
            help="Install for test environment",
        )
        parser.add_argument(
            "--install-dir",
            dest="install_dir",
            help="Path to server installation directory",
        )

    def run(self):
        compose = Compose()
        logger.debug("Installing touca server")
        install_dir = (
            Path(
                self.options.get("install_dir")
                if self.options.get("install_dir")
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
            uninstall_instance(compose, install_dir)

        for x in ["minio", "mongo", "redis"]:
            data_dir.joinpath(x).mkdir(exist_ok=True, parents=True)
        is_dev_mode = self.options.get("dev")
        is_test_mode = self.options.get("test")
        extension = "dev" if is_dev_mode else "test" if is_test_mode else "prod"
        install_file(install_dir, f"ops/docker-compose.{extension}.yml")
        install_file(install_dir, "ops/mongo/entrypoint/entrypoint.js")
        install_file(install_dir, "ops/mongo/mongod.conf")
        upgrade_instance(compose, install_dir)
        if not is_dev_mode and not check_server_status(attempts=10, port=8080):
            raise RuntimeError(
                "Touca server did not pass our health checks in time."
                " It may be down or misconfigured."
                " Try running 'touca server logs' to learn more."
            )
        if not is_dev_mode:
            logger.info("Go to http://localhost:8080/ to complete the installation")


class LogsCommand(CliCommand):
    name = "logs"
    help = "Show touca server logs"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument(
            "--follow",
            dest="follow",
            const=True,
            default=False,
            nargs="?",
            help="Follow log output",
        )

    def run(self):
        compose = Compose()
        install_dir = find_install_dir()
        compose_file = find_compose_file(install_dir)
        if not compose_file:
            raise RuntimeError(f"Touca server is not installed in {install_dir}")
        arguments = ["logs", "--tail", "1000"]
        if self.options.get("follow", False):
            arguments.append("--follow")
        if check_server_status():
            arguments.append("touca_touca")
        try:
            compose.run(compose_file, *arguments)
        except KeyboardInterrupt:
            print()


class StatusCommand(CliCommand):
    name = "status"
    help = "Show the status of a locally running instance of Touca server"

    def run(self):
        if not check_server_status():
            raise RuntimeError("Touca server appears to be down")


class UninstallCommand(CliCommand):
    name = "uninstall"
    help = "Uninstall and remove your local instance of Touca server"

    def run(self):
        compose = Compose()
        logger.info("Uninstalling touca server")
        install_dir = find_install_dir()
        logger.info("Uninstalling %s", install_dir)
        uninstall_instance(compose, install_dir)


class UpgradeCommand(CliCommand):
    name = "upgrade"
    help = "Upgrade your local instance of Touca server to the latest version"

    def run(self):
        compose = Compose()
        logger.info("Upgrading touca server")
        install_dir = find_install_dir()
        logger.info("Upgrading %s", install_dir)
        upgrade_instance(compose, install_dir)


class ServerCommand(CliCommand):
    name = "server"
    help = "Install and manage your Touca server"
    subcommands = [
        InstallCommand,
        LogsCommand,
        StatusCommand,
        UpgradeCommand,
        UninstallCommand,
    ]
