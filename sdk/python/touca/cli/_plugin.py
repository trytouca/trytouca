# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from pathlib import Path
import sys

from touca.cli._common import Operation, invalid_subcommand
from touca._options import find_home_path


def user_plugins():
    import sys
    import importlib
    import inspect

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
    help = "Manage custom CLI plugins"

    @classmethod
    def parser(self, parser: ArgumentParser):
        parsers = parser.add_subparsers(dest="subcommand")
        parsers.add_parser(
            "list",
            description="List available plugins",
            help="List available plugins",
        )
        parsers_add = parsers.add_parser(
            "add",
            description="Install a CLI plugin",
            help="Install a CLI plugin",
        )
        parsers_add.add_argument("name", help="name of the plugin")
        parsers_add = parsers.add_parser(
            "remove",
            description="Uninstall a CLI plugin",
            help="Uninstall a CLI plugin",
        )
        parsers_add.add_argument("name", help="name of the plugin")

    def __init__(self, options: dict):
        self.__options = options

    def _command_list(self):
        for member in user_plugins():
            print("{}: {}".format(member.name, member.help))
        return True

    def _command_add(self):
        from shutil import copyfile

        plugin_name = self.__options.get("name")
        plugin_path_src = Path.cwd().joinpath(plugin_name).with_suffix(".py")
        if not plugin_path_src.exists():
            print(f'did not find a plugin with name "{plugin_name}"', file=sys.stderr)
            return False
        plugin_path_dst = Path(find_home_path(), "plugins", plugin_name).with_suffix(
            ".py"
        )
        if plugin_path_dst.exists():
            print(f'plugin "{plugin_name}" is already installed', file=sys.stderr)
            return False
        plugin_path_dst.parent.mkdir(exist_ok=True)
        copyfile(plugin_path_src, plugin_path_dst)
        return True

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

    def run(self):
        commands = {
            "add": self._command_add,
            "list": self._command_list,
            "remove": self._command_remove,
        }
        command = self.__options.get("subcommand")
        if not command:
            return invalid_subcommand(Plugin)
        if command in commands:
            return commands.get(command)()
        return False
