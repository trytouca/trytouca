# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import sys
from argparse import ArgumentParser
from pathlib import Path

from touca._options import find_home_path
from touca.cli._common import Operation, invalid_subcommand


def user_plugins():
    import importlib
    import inspect
    import sys

    plugins_dir = Path(find_home_path(), "plugins")
    modules = [p.absolute() for p in plugins_dir.glob("*") if p.is_file()]
    for module in modules:
        syspath = Path(module.parent).absolute()
        sys.path.append(f"{syspath}/")
        mod = importlib.import_module(module.stem)
        for (_, member) in inspect.getmembers(mod):
            if not inspect.isclass(member):
                continue
            tree = inspect.getclasstree(inspect.getmro(member), unique=True)
            tmp = tree[1][-1][-1]
            if type(tmp) is list:
                yield member
        sys.path.remove(f"{syspath}/")


class Plugin(Operation):
    name = "plugin"
    help = "Install and manage custom CLI plugins"

    @classmethod
    def parser(self, parser: ArgumentParser):
        parsers = parser.add_subparsers(dest="subcommand")
        parsers.add_parser(
            "ls",
            description="List available plugins",
            help="List available plugins",
        )
        parsers_add = parsers.add_parser(
            "add",
            description="Install a plugin",
            help="Install a plugin",
        )
        parsers_add.add_argument("name", help="name of the plugin")
        parsers_remove = parsers.add_parser(
            "rm",
            description="Uninstall a plugin",
            help="Uninstall a plugin",
        )
        parsers_remove.add_argument("name", help="name of the plugin")
        parsers.add_parser(
            "new", description="Create a new plugin", help="Create a new plugin"
        )

    def __init__(self, options: dict):
        self.__options = options

    def _command_list(self):
        from touca._printer import print_table

        plugins = list(user_plugins())
        if not plugins:
            print("No user-defined plugins are registered.")
            return True
        table_header = ["", "Name", "Description"]
        table_body = [
            [f"{idx + 1}", member.name, member.help]
            for idx, member in enumerate(plugins)
        ]
        print_table(table_header, table_body)
        return True

    def _command_add(self):
        from shutil import copyfile

        plugin_arg: str = self.__options.get("name")
        plugin_name = plugin_arg
        plugin_path_dst = Path(find_home_path(), "plugins", plugin_name).with_suffix(
            ".py"
        )
        plugin_path_dst.parent.mkdir(exist_ok=True)
        if plugin_path_dst.exists():
            print(f'plugin "{plugin_name}" is already installed', file=sys.stderr)
            return False
        plugin_path_src = Path.cwd().joinpath(plugin_name).with_suffix(".py")
        if plugin_path_src.exists():
            copyfile(plugin_path_src, plugin_path_dst)
            return True
        print(f'did not find a plugin at "{plugin_arg}"', file=sys.stderr)
        return False

    def _command_remove(self):
        plugin_name = self.__options.get("name")
        plugin_path_dst = Path(find_home_path(), "plugins", plugin_name).with_suffix(
            ".py"
        )
        if not plugin_path_dst.exists():
            print(f'plugin "{plugin_name}" is missing', file=sys.stderr)
            return False
        Path.unlink(plugin_path_dst)
        return True

    def _command_template(self):
        content = """
from argparse import ArgumentParser

from touca.cli._common import Operation


class Example(Operation):
    name = "example"
    help = "Example"

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument("args", nargs="+", help="any problem")

    def run(self):
        print("Example!")
        return True
"""
        dir = Path.cwd()
        file = "example.py"
        dir.joinpath(file).write_text(content)
        print(
            f'Created plugin "{file}" in "{dir}" for you to implement.\n'
            f'Run "touca plugin add {file}" when you are ready to register it.'
        )
        return True

    def run(self):
        commands = {
            "add": self._command_add,
            "ls": self._command_list,
            "rm": self._command_remove,
            "new": self._command_template,
        }
        command = self.__options.get("subcommand")
        if not command:
            return invalid_subcommand(Plugin)
        if command in commands:
            return commands.get(command)()
        return False
