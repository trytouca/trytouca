# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import importlib
import inspect
import sys
from typing import List
from argparse import ArgumentParser
from pathlib import Path
from shutil import copyfile

from touca._options import find_home_path
from touca._printer import print_table
from touca.cli.common import CliCommand, UnknownSubcommandError


def user_plugins():
    plugins_dir = Path(find_home_path(), "plugins")
    modules = [p.absolute() for p in plugins_dir.glob("*") if p.is_file()]
    for module in modules:
        syspath = Path(module.parent).absolute()
        sys.path.append(f"{syspath}/")
        mod = importlib.import_module(module.stem)
        for _, member in inspect.getmembers(mod):
            if not inspect.isclass(member):
                continue
            tree = inspect.getclasstree(inspect.getmro(member), unique=True)
            tmp = tree[1][-1][-1]
            if type(tmp) is list:
                yield member
        sys.path.remove(f"{syspath}/")


class AddCommand(CliCommand):
    name = "add"
    help = "Install a plugin"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("name", help="name of the plugin")

    def run(self):
        plugin_arg: str = self.__options.get("name")
        plugin_name = plugin_arg
        plugin_path_dst = Path(find_home_path(), "plugins", plugin_name).with_suffix(
            ".py"
        )
        plugin_path_dst.parent.mkdir(exist_ok=True)
        if plugin_path_dst.exists():
            raise RuntimeError(f'plugin "{plugin_name}" is already installed')
        plugin_path_src = Path.cwd().joinpath(plugin_name).with_suffix(".py")
        if not plugin_path_src.exists():
            raise RuntimeError(f'did not find a plugin at "{plugin_arg}"')
        copyfile(plugin_path_src, plugin_path_dst)


class CreateCommand(CliCommand):
    name = "new"
    help = "Create a new plugin"

    def run(self):
        content = """
from argparse import ArgumentParser

from touca.cli.common import CliCommand


class Example(CliCommand):
    name = "example"
    help = "Example"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("arg", default="world", help="sample option")

    def run(self):
        print(f"Hello {self.options('arg')}!")
        return True
"""
        dir = Path.cwd()
        file = "example.py"
        dir.joinpath(file).write_text(content)
        print(
            f'Created plugin "{file}" in "{dir}" for you to implement.\n'
            f'Run "touca plugin add {file}" when you are ready to register it.'
        )


class ListCommand(CliCommand):
    name = "ls"
    help = "List available plugins"

    def run(self):
        plugins = list(user_plugins())
        if not plugins:
            print("No user-defined plugins are registered.")
            return
        table_header = ["", "Name", "Description"]
        table_body = [
            [f"{idx + 1}", member.name, member.help]
            for idx, member in enumerate(plugins)
        ]
        print_table(table_header, table_body)


class RemoveCommand(CliCommand):
    name = "rm"
    help = "Uninstall a plugin"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("name", help="name of the plugin")

    def run(self):
        plugin_name = self.__options.get("name")
        plugin_path_dst = Path(find_home_path(), "plugins", plugin_name).with_suffix(
            ".py"
        )
        if not plugin_path_dst.exists():
            raise RuntimeError(f'plugin "{plugin_name}" is missing')
        Path.unlink(plugin_path_dst)


class PluginCommand(CliCommand):
    name = "plugin"
    help = "Install and manage custom CLI plugins"
    subcommands: List[CliCommand] = [
        AddCommand,
        CreateCommand,
        ListCommand,
        RemoveCommand,
    ]

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parsers = parser.add_subparsers(dest="subcommand")
        for cmd in cls.subcommands:
            cmd.parser(parsers.add_parser(cmd.name, help=cmd.help))

    def run(self):
        command = self.options.get("subcommand")
        if not command:
            raise UnknownSubcommandError(PluginCommand)
        subcommand = next(i for i in PluginCommand.subcommands if i.name == command)
        if not subcommand:
            raise UnknownSubcommandError(PluginCommand)
        subcommand(self.options).run()
