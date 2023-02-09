# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import sys
from argparse import ArgumentParser
from configparser import ConfigParser

from touca._options import (
    apply_api_url,
    apply_config_profile,
    apply_core_options,
    apply_environment_variables,
    find_profile_path,
)
from touca._transport import AuthClient
from touca.cli.common import CliCommand


class LoginCommand(CliCommand):
    name = "login"
    help = "Log in to Touca from the CLI using a web browser"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("--api-url", help="Touca API URL")

    def resolve_options(self):
        options = {}
        apply_config_profile(options)
        apply_environment_variables(options)
        apply_api_url(options)
        apply_core_options(options)
        if self.options.get("api_url"):
            options["api_url"] = self.options.get("api_url")
        return options

    def poll_api_key(self, client: AuthClient, token: str):
        from time import sleep

        status, api_key = None, None
        while status != "verified":
            status, api_key = client.auth_token_status(token)
            if status == "unverified":
                sleep(1)
            elif status == "verified":
                return api_key
            else:
                return

    def persist_api_key(self, api_key: str):
        path = find_profile_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        config = ConfigParser()
        if path.exists():
            config.read_string(path.read_text())
        if not config.has_section("settings"):
            config.add_section("settings")
        config.set("settings", "api-key", api_key)
        with open(path, "wt") as file:
            config.write(file)

    def run(self):
        from webbrowser import open as open_browser

        options = self.resolve_options()
        client = AuthClient(options)
        if client.verify_api_key():
            print("You are already logged in.")
            return
        token, login_url = client.create_auth_token()
        print("You may now log in to Touca from the opened browser tab.")
        print("If one didn't automatically open, visit the link below:")
        print(login_url)
        open_browser(login_url, new=2)
        try:
            api_key = self.poll_api_key(client, token)
            if api_key is None:
                print("Failed to log in. You may try again.")
                sys.exit(1)
            self.persist_api_key(api_key)
            print("You are logged in.")
        except KeyboardInterrupt:
            print("Login aborted.")
            sys.exit(1)
