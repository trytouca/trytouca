# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

from argparse import ArgumentParser
from json import loads
from typing import Dict, Optional, Tuple

from touca._options import (
    ToucaError,
    apply_api_url,
    apply_config_profile,
    apply_core_options,
    apply_environment_variables,
)
from touca._printer import console
from touca._transport import Transport
from touca.cli.common import CliCommand, config_set


class LoginCommand(CliCommand):
    name = "login"
    help = "Set API credentials from the CLI"

    @classmethod
    def parser(cls, parser: ArgumentParser):
        parser.add_argument("--api-url", help="URL to Touca server API")

    def run(self) -> None:
        from time import sleep
        from webbrowser import open as open_browser

        api_key, api_url = _get_api_credentials(self.options.get("api_url"))
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
                    payload: Dict[str, str] = loads(response.data.decode("utf-8"))
                    config_set({"api-key": payload["apiKey"], "api-url": api_url})
                    console.print("  ✅ You are now logged in.\n")
                    return
                if response.status == 404:
                    break
            console.print("\n  🛑 Login failed. You may try again.\n")
        except KeyboardInterrupt:
            console.print("\n  👋🏼 Login aborted.\n")

    def request_token(self, transport: Transport):
        response = transport.request("POST", "/client/auth")
        if response.status != 200:
            raise ToucaError("auth_invalid_response", response.status)
        response_data: Dict[str, str] = loads(response.data.decode("utf-8"))
        return tuple(map(response_data.get, ["token", "webUrl"]))


def _get_api_credentials(cli_api_url: Optional[str]) -> Tuple[Optional[str], str]:
    options: Dict[str, str] = {}
    apply_config_profile(options)
    apply_environment_variables(options)
    apply_api_url(options)
    api_url = cli_api_url if cli_api_url else options.get("api_url", "https://api.touca.io")
    return options.get("api_key"), api_url
