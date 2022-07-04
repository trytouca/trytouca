# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import csv
from dataclasses import dataclass
from functools import partial
from loguru import logger
from client_api import ApiClient
from utilities import User


@dataclass
class Playbook:
    @classmethod
    def reader(cls, filepath: str):
        with open(filepath, "rt") as csvfile:
            reader = csv.reader(csvfile, delimiter=",", quotechar='"')
            next(reader, None)
            instance = cls()
            for row in reader:
                row = list(filter(None, row))
                if row[0].startswith("#"):
                    continue
                user = User.from_fullname(row[0])
                method_name = "_".join(row[1].split("-"))
                method = getattr(instance, method_name, None)
                if not method:
                    logger.warning("action {} has no class", row[1])
                    continue
                yield partial(method, user, row[2:])

    def account_create(self, user: User, args):
        ApiClient().account_create(user)

    def account_fail_login(self, user: User, args):
        ApiClient().account_fail_login(user)

    def account_onboard(self, user: User, args):
        user.fullname = args[0]
        ApiClient().account_onboard(user)

    def account_reset_apply(self, user: User, args):
        ApiClient().account_reset_apply(user)

    def account_reset_request(self, user: User, args):
        ApiClient().account_reset_request(user)

    def server_install(self, user: User, args):
        ApiClient().server_install(user)

    def team_create(self, user: User, args):
        team_slug, team_name = args
        with ApiClient(user) as api_client:
            api_client.team_create(team_slug, team_name)

    def team_update(self, user: User, args):
        old_team_slug, new_team_slug, new_team_name = args
        with ApiClient(user) as api_client:
            api_client.team_update(old_team_slug, new_team_slug, new_team_name)

    def team_invite_add(self, user: User, args):
        team_slug = args[0]
        fullnames = args[1:]
        with ApiClient(user) as api_client:
            for fullname in fullnames:
                user = User.from_fullname(fullname)
                api_client.team_invite_add(team_slug, user)

    def team_invite_rescind(self, user: User, args):
        team_slug = args[0]
        fullnames = args[1:]
        with ApiClient(user) as api_client:
            for fullname in fullnames:
                user = User.from_fullname(fullname)
                api_client.team_invite_rescind(team_slug, user)

    def team_invite_accept(self, user: User, args):
        team_slug = args[0]
        with ApiClient(user) as api_client:
            api_client.team_invite_accept(team_slug)

    def team_invite_decline(self, user: User, args):
        team_slug = args[0]
        with ApiClient(user) as api_client:
            api_client.team_invite_decline(team_slug)

    def team_join_add(self, user: User, args):
        team_slug = args[0]
        with ApiClient(user) as api_client:
            api_client.team_join_add(team_slug)

    def team_join_rescind(self, user: User, args):
        team_slug = args[0]
        with ApiClient(user) as api_client:
            api_client.team_join_rescind(team_slug)

    def team_join_accept(self, user: User, args):
        team_slug = args[0]
        fullnames = args[1:]
        with ApiClient(user) as api_client:
            for fullname in fullnames:
                user = User.from_fullname(fullname)
                api_client.team_join_accept(team_slug, user)

    def team_join_decline(self, user: User, args):
        team_slug = args[0]
        fullnames = args[1:]
        with ApiClient(user) as api_client:
            for fullname in fullnames:
                user = User.from_fullname(fullname)
                api_client.team_join_decline(team_slug, user)

    def team_leave(self, user: User, args):
        team_slug = args[0]
        with ApiClient(user) as api_client:
            api_client.team_leave(team_slug)

    def team_member_update(self, user: User, args):
        team_slug, member_fullname, new_role = args
        member_user = User.from_fullname(member_fullname)
        with ApiClient(user) as api_client:
            api_client.team_member_update(team_slug, member_user, new_role)

    def batch_seal(self, user: User, args):
        batch_path = "/".join(args[0:3])
        with ApiClient(user) as api_client:
            api_client.batch_seal(batch_path)
        logger.success("{} sealed {}", user, "/".join(args[0:3]))

    def batch_promote(self, user: User, args):
        batch_path = "/".join(args[0:3])
        promotion_reason = args[3]
        with ApiClient(user) as api_client:
            api_client.batch_promote(batch_path, promotion_reason)
        logger.success("{} promoted {}", user, "/".join(args[0:3]))

    def client_submit(self, user: User, args):
        team_slug, suite_slug, batch_slug = args
        with ApiClient(user) as api_client:
            api_client.client_submit(team_slug, suite_slug, batch_slug)

    def comment_create(self, user: User, args):
        batch_path = "/".join(args[0:3])
        comment_body = args[3]
        with ApiClient(user) as api_client:
            api_client.comment_create(batch_path, comment_body)

    def suite_create(self, user: User, args):
        team_slug, suite_slug, suite_name = args
        with ApiClient(user) as api_client:
            api_client.suite_create(team_slug, suite_slug, suite_name)

    def suite_update(self, user: User, args):
        team_slug, old_suite_slug, new_suite_slug, new_suite_name = args
        with ApiClient(user) as api_client:
            api_client.suite_update(
                team_slug, old_suite_slug, new_suite_slug, new_suite_name
            )

    def suite_remove(self, user: User, args):
        team_slug, suite_slug = args
        with ApiClient(user) as api_client:
            api_client.suite_remove(team_slug, suite_slug)

    def suite_subscribe(self, user: User, args):
        team_slug, suite_slug, level = args
        with ApiClient(user) as api_client:
            api_client.suite_subscribe(team_slug, suite_slug, level)
