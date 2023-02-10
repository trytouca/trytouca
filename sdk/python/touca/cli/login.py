# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import sys
from argparse import ArgumentParser
from configparser import ConfigParser

from touca._options import (
    ToucaError,
    apply_api_url,
    apply_config_profile,
    apply_core_options,
    apply_environment_variables,
)
from touca._transport import Transport
from touca.cli.common import CliCommand, config_set


class LoginCommand(CliCommand):
    name = "login"
    help = "Log into your Touca server from the CLI"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("--api-url", help="Touca API URL")

    def run(self):
        from json import loads
        from time import sleep
        from webbrowser import open as open_browser

        from rich.console import Console

        # init dependencies

        console = Console()
        transport = Transport()

        # resolve options

        options = {}
        apply_config_profile(options)
        apply_environment_variables(options)
        apply_api_url(options)
        apply_core_options(options)
        if self.options.get("api_url"):
            options["api_url"] = self.options.get("api_url")

        # check if already logged in

        try:
            transport.configure(options)
            console.print("You are already logged in.")
            return
        except ToucaError:
            pass

        # initiate login

        token_response = transport.request("POST", "/client/auth")
        token_data = loads(token_response.data.decode("utf-8"))
        token = token_data.get("token")
        login_url = token_data.get("url")
        console.print(
            "You may now log into Touca from the opened browser tab."
            "\nGo the following URL if one didn't open automatically."
            f"\n\n  {login_url}"
        )
        open_browser(login_url, new=2)

        # wait for login to complete

        try:
            status = "unverified"
            while status != "verified":
                status_response = transport.request("GET", f"/client/auth/{token}")
                status_data = loads(status_response.data.decode("utf-8"))
                status = status_data.get("status")
                if status == "unverified":
                    sleep(1)
                elif status == "verified":
                    api_key = status_data.get("apiKey")
                    config_set({"api-key": api_key})
                    console.print("\nYou are now logged in.")
                    return
                else:
                    console.print("\nFailed to log in. You may try again.")
                    sys.exit(1)
        except KeyboardInterrupt:
            console.print("\nLogin aborted.")
            sys.exit(1)
