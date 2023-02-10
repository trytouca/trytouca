# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from json import loads
from typing import Dict

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
    help = "Set API credentials from the CLI"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument(
            "--api-url",
            help="URL to Touca server API",
            default="https://api.touca.io",
        )

    def run(self):
        from time import sleep
        from webbrowser import open as open_browser
        from rich.console import Console

        console = Console()
        api_key, api_url = self.get_api_credentials()
        transport = Transport()
        transport._api_url = api_url
        if api_key:
            transport.configure({"api_key": api_key, "api_url": api_url})
            console.print("\n  ✅ You are already logged in!\n")
            return

        token, web_url = self.request_token(transport)
        console.print(f"\n  ⏳ Opening {web_url}\n")
        open_browser(web_url, new=2)

        try:
            for _ in range(90):
                sleep(1)
                response = transport.request("GET", f"/client/auth/{token}")
                if response.status == 204:
                    continue
                if response.status == 200:
                    payload = loads(response.data.decode("utf-8"))
                    api_key = payload.get("apiKey")
                    config_set({"api-key": api_key})
                    console.print("  ✅ You are now logged in.\n")
                    return
                if response.status == 404:
                    break
            console.print("\n  🛑 Login failed. You may try again.\n")
        except KeyboardInterrupt:
            console.print("\n  🛑 Login aborted.\n")
            return False

    def get_api_credentials(self):
        options: Dict[str, str] = {}
        apply_config_profile(options)
        apply_environment_variables(options)
        apply_api_url(options)
        apply_core_options(options)
        if self.options.get("api_url"):
            options["api_url"] = self.options.get("api_url")
        return tuple(map(options.get, ["api_key", "api_url"]))

    def request_token(self, transport: Transport):
        response = transport.request("POST", "/client/auth")
        if response.status != 200:
            raise ToucaError("auth_invalid_response", response.status)
        response_data: Dict[str, str] = loads(response.data.decode("utf-8"))
        return tuple(map(response_data.get, ["token", "webUrl"]))
