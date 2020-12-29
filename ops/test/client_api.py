#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

import os
import subprocess
import tarfile
import tempfile
import urllib
from loguru import logger
import requests
from client_mongo import WeaselMongoClient
from utilities import User, pathify

WEASEL_API_ROOT="http://localhost:8081/"
WEASEL_UTILS_EXE=pathify("../../clients/cpp/local/dist/bin/weasel_cli")
WEASEL_RESULTS_ARCHIVE=pathify("results.tar.gz")

class HttpClient:
    def __init__(self, root_url: str):
        self.root_url = root_url
        self.session = requests.Session()

    def get_json(self, path: str) -> requests.Response:
        return self.session.get(url=self.root_url + path)

    def post_json(self, path: str, body=None) -> requests.Response:
        return self.session.post(url=self.root_url + path, json=body)

    def patch_json(self, path: str, body=None) -> requests.Response:
        return self.session.patch(url=self.root_url + path, json=body)

    def delete(self, path: str) -> requests.Response:
        return self.session.delete(url=self.root_url + path)

class WeaselApiClient:
    def __init__(self, user=None):
        self.client = HttpClient(WEASEL_API_ROOT)
        self.user = user

    def __enter__(self):
        if self.user is None:
            raise RuntimeError("user is not specified")
        response = self.client.post_json('auth/signin', {
            'username': self.user.username,
            'password': self.user.password
        })
        if response.status_code != 200:
            raise RuntimeError(f'failed to sign in for user {self.user}')
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        response = self.client.post_json('auth/signout')
        if response.status_code != 204:
            raise RuntimeError(f'failed to sign out for user {self.user}')

    def is_up(self) -> bool:
        """
        Checks if platform is running and is properly configured.
        """
        try:
            response = self.client.get_json('platform')
            if response.status_code != 200:
                logger.warning("platform is down")
                return False
            if not response.json().get("ready"):
                logger.warning("platform is not ready")
                return False
            if response.json().get("mail"):
                logger.warning("platform has mail transport")
                return False
            return True
        except requests.ConnectionError:
            logger.warning("failed to perform handshake with platform")
            return False

    def expect_status(self, response: requests.Response, code: int, message: str) -> None:
        new_message = f"let user {self.user} {message}"
        assert response.status_code == code, new_message

    def account_create(self, user: User) -> None:
        response = self.client.post_json('auth/signup', {
            'email': user.email,
            'fullname': user.fullname,
            'username': user.username,
            'password': user.password
        })
        self.user = user
        self.expect_status(response, 201, "register account")

    def account_activate(self, user: User) -> None:
        key = WeaselMongoClient().get_user_activation_key(user)
        response = self.client.post_json(f'auth/activate/{key}')
        self.user = user
        self.expect_status(response, 204, "activate account")

    def account_reset(self, user: User) -> None:
        response = self.client.post_json("auth/reset", {
            "email": user.email
        })
        self.expect_status(response, 204, "request password reset")
        key = WeaselMongoClient().get_account_reset_key(user)
        response = self.client.get_json(f"auth/reset/{key}")
        self.expect_status(response, 200, "get basic account information")
        response = self.client.post_json(f"auth/reset/{key}", {
            "username": user.username,
            "password": user.password
        })
        self.expect_status(response, 204, "apply new password")

    def get_api_key(self) -> str:
        response = self.client.get_json('user')
        self.expect_status(response, 200, "lookup user info")
        return response.json().get('apiKeys')[0]

    def make_platform_admin(self, user: User) -> None:
        response = self.client.patch_json(f"platform/account/{user.username}", {
            'role': 'admin'
        })
        self.expect_status(response, 204, f"make user {user} admin of platform")

    def team_create(self, team_slug: str, team_name: str) -> None:
        """
        Creates an empty team `team_name`.
        Requires Auth Token.
        """
        response = self.client.post_json('team', {
            'name': team_name,
            'slug': team_slug
        })
        self.expect_status(response, 200, f"create team {team_slug}")

    def team_update(self, current_slug: str, team_slug: str, team_name: str) -> None:
        expected_status = 204
        body = { "name": team_name }
        if team_slug != current_slug:
            body["slug"] = team_slug
            expected_status = 201
        response = self.client.patch_json(f'team/{current_slug}', body)
        self.expect_status(response, expected_status, f"update team {team_slug}")

    def team_invite_add(self, team_slug: str, user: User) -> None:
        response = self.client.post_json(f'team/{team_slug}/invite', {
            'email': user.email,
            'fullname': user.fullname
        })
        self.expect_status(response, 204, f"invite user {user} to team {team_slug}")

    def team_invite_rescind(self, team_slug: str, user: User) -> None:
        response = self.client.post_json(f'team/{team_slug}/invite/rescind', {
            'email': user.email
        })
        self.expect_status(response, 204, f"rescind invitation of user {user} to team {team_slug}")

    def team_invite_accept(self, team_slug: str) -> None:
        response = self.client.post_json(f'team/{team_slug}/invite/accept')
        self.expect_status(response, 204, f"accept invitation to join team {team_slug}")

    def team_invite_decline(self, team_slug: str) -> None:
        response = self.client.post_json(f"team/{team_slug}/invite/decline")
        self.expect_status(response, 204, f"decline invitation to join team {team_slug}")

    def team_join_add(self, team_slug: str) -> None:
        response = self.client.post_json(f"team/{team_slug}/join")
        self.expect_status(response, 204, f"submit request to join team {team_slug}")

    def team_join_rescind(self, team_slug: str) -> None:
        response = self.client.delete(f"team/{team_slug}/join")
        self.expect_status(response, 204, f"rescind request to join team {team_slug}")

    def team_join_accept(self, team_slug: str, user: User) -> None:
        response = self.client.post_json(f'team/{team_slug}/join/{user.username}')
        self.expect_status(response, 204, f"accept {user} request to join team {team_slug}")

    def team_join_decline(self, team_slug: str, user: User) -> None:
        response = self.client.delete(f'team/{team_slug}/join/{user.username}')
        self.expect_status(response, 204, f"decline {user} request to join team {team_slug}")

    def team_leave(self, team_slug: str) -> None:
        response = self.client.post_json(f"team/{team_slug}/leave")
        self.expect_status(response, 204, f"leave team {team_slug}")

    def team_member_update(self, team_slug: str, member_user: User, role: str) -> None:
        response = self.client.patch_json(f'team/{team_slug}/member/{member_user.username}', {
            'role': role
        })
        self.expect_status(response, 204, f"make user {member_user.username} admin of team {team_slug}")

    def suite_create(self, team_slug: str, suite_slug: str, suite_name: str) -> None:
        """
        Creates an empty suite `suite_name` in team `team_slug`.
        Requires Auth Token.
        """
        response = self.client.post_json(f'suite/{team_slug}', {
            'name': suite_name,
            'slug': suite_slug
        })
        self.expect_status(response, 200, f"create suite {suite_slug} in team {team_slug}")

    def suite_update(self, team_slug: str, suite_slug: str, new_slug: str, new_name: str) -> None:
        expected_status = 204
        body = { "name": new_name }
        if suite_slug != new_slug:
            body["slug"] = new_slug
            expected_status = 201
        response = self.client.patch_json(f'suite/{team_slug}/{suite_slug}', body)
        self.expect_status(response, expected_status, f"update suite {suite_slug}")

    def suite_remove(self, team_slug: str, suite_slug: str):
        response = self.client.delete(f"suite/{team_slug}/{suite_slug}")
        self.expect_status(response, 202, f"remove suite {team_slug}/{suite_slug}")

    def suite_subscribe(self, team_slug: str, suite_slug: str):
        response = self.client.post_json(f"suite/{team_slug}/{suite_slug}/subscribe")
        self.expect_status(response, 204, f"subscribed to suite {team_slug}/{suite_slug}")

    def suite_unsubscribe(self, team_slug: str, suite_slug: str):
        response = self.client.post_json(f"suite/{team_slug}/{suite_slug}/unsubscribe")
        self.expect_status(response, 204, f"unsubscribed to suite {team_slug}/{suite_slug}")

    def comment_create(self, batch_path: str, comment_body: str):
        response = self.client.post_json(f'comment/{batch_path}/c', {
            "body": comment_body
        })
        self.expect_status(response, 204, f"create comment on {batch_path}")

    def batch_seal(self, batch_path: str):
        response = self.client.post_json(f'batch/{batch_path}/seal')
        self.expect_status(response, 204, f"seal {batch_path}")

    def batch_promote(self, batch_path: str, reason: str):
        response = self.client.post_json(f'batch/{batch_path}/promote', {
            "reason": reason
        })
        self.expect_status(response, 204, f"promote {batch_path}")

    def client_submit(self, team_slug: str, suite_slug: str, batch_slug: str):
        slugs = [ team_slug, suite_slug, batch_slug ]
        api_key = self.get_api_key()
        api_route = '/'.join(['@', *slugs[0:2]])
        api_url = urllib.parse.urljoin(WEASEL_API_ROOT, api_route)
        with tempfile.TemporaryDirectory() as tmpdir:
            logger.debug("created tmp directory: {}", tmpdir)
            with tarfile.open(WEASEL_RESULTS_ARCHIVE) as tar:
                tar.extractall(tmpdir)
            batch_dir = os.path.join(tmpdir, 'results', *slugs[0:3])
            command = [ WEASEL_UTILS_EXE, 'post',
                '--api-url', api_url, '--api-key', api_key, '--src', batch_dir ]
            proc = subprocess.Popen(command)
            proc.communicate()
            assert proc.returncode == 0
            logger.success("{} submitted {}", self.user, '/'.join(slugs[0:3]))
