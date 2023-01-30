# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import importlib
import inspect
import sys
from argparse import ArgumentParser
from pathlib import Path

from touca._options import find_home_path
from touca._printer import print_table
from touca.cli.common import CliCommand


def user_plugins():
    plugins_dir = Path(find_home_path(), "plugins")
    modules = [p.absolute() for p in plugins_dir.glob("*") if p.is_file()]
    for module in modules:
        syspath = Path(module.parent).absolute()
        sys.path.append(f"{syspath}/")
        mod = importlib.import_module(module.stem)
        sys.path.remove(f"{syspath}/")
        for _, member in inspect.getmembers(mod):
            if not inspect.isclass(member):
                continue
            tree = inspect.getclasstree(inspect.getmro(member), unique=True)
            tmp = tree[1][-1][-1]
            if type(tmp) is list:
                yield member
                break


class AddCommand(CliCommand):
    name = "add"
    help = "Install a plugin"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("name", help="name of the plugin")

    def run(self):
        from shutil import copyfile

        plugin_name: str = self.options.get("name")
        is_official = plugin_name.startswith("plugins://")
        if is_official:
            plugin_name = plugin_name[10:]
        plugin_path_dst = (
            find_home_path().joinpath("plugins", plugin_name).with_suffix(".py")
        )
        plugin_path_dst.parent.mkdir(parents=True, exist_ok=True)
        if plugin_path_dst.exists():
            raise RuntimeError(f'plugin "{plugin_name}" is already installed')
        src_dir = (
            Path(__file__).parent.joinpath("plugins") if is_official else Path.cwd()
        )
        plugin_path_src = src_dir.joinpath(plugin_name).with_suffix(".py")
        if not plugin_path_src.exists():
            raise RuntimeError(f'plugin "{plugin_name}" is missing')
        copyfile(plugin_path_src, plugin_path_dst)


class CreateCommand(CliCommand):
    name = "new"
    help = "Create a new plugin"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("filename", help="name of the plugin")

    def run(self):
        content = """
from touca.cli.common import CliCommand

class {classname}ToucaCliPlugin(CliCommand):
    name = "{slug}"
    help = "Brief description of this plugin"

    def run(self):
        print(f"Hello world!")
"""
        dir = Path.cwd()
        name: str = self.options.get("filename")
        dir.joinpath(name).with_suffix(".py").write_text(
            content.format(slug=name, classname=name.capitalize())
        )
        print(
            f'Created plugin "{name}" for you to implement.\n'
            f'Run "touca plugin add {name}" when you are ready to register it.'
        )


class ListCommand(CliCommand):
    name = "ls"
    help = "List available plugins"

    def run(self):
        plugins = list(user_plugins())
        if not plugins:
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
        plugin_name = self.options.get("name")
        plugin_path_dst = Path(find_home_path(), "plugins", plugin_name).with_suffix(
            ".py"
        )
        if not plugin_path_dst.exists():
            raise RuntimeError(f'plugin "{plugin_name}" is missing')
        Path.unlink(plugin_path_dst)


class PluginCommand(CliCommand):
    name = "plugin"
    help = "Install and manage custom CLI plugins"
    subcommands = [
        CreateCommand,
        AddCommand,
        ListCommand,
        RemoveCommand,
    ]
