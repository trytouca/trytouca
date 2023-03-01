# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

"""
This script shows how to authenticate and interact with the Touca Server API
as defined by https://touca.io/docs/external/api/index.html.
"""

import requests

# URL to entry point of the Touca Server API. In self-hosted deployments,
# this URL may be of the form: `http://localhost:8080/api`
# or `https://touca.your.company/api`.
ApiRoot = "http://localhost:8080/api"

# Credentials of the user account on whose behalf the client authenticates.
Credentials = {"email": "alice@touca.io", "password": "Touca$123"}


def main():
    """
    Clients are expected to authenticate with the Touca Server API
    before they can make requests to access or modify information.

    We authenticate by submitting email and password.
    After successful authentication, the server issues an access
    token in form of an HTTP-only cookie that may be sent along in
    subsequent requests. The server indicates expiration time of
    this token in the field "expiresAt" of its JSON response.

    Access tokens are valid for 30 days since their time of issue.
    They can be renewed at any time for long-running applications.
    See API documentation for "/auth/extend" for more information.
    They can be purged at any time if needed.
    See API documentation for "/auth/signout" for more information.

    In small one-time scripts, we recommend that the client asks
    for an access token every time during application startup process.
    Touca API may choose to re-use an already issued access token.
    """

    session = requests.Session()
    response = session.post(url=ApiRoot + "/auth/signin", json=Credentials)

    # we expect a response status of 200. In more serious applications,
    # consider checking response.status_code instead.
    response.raise_for_status()

    # Curious engineers can view the issued token and the JSON response.
    # But we generally advise against printing or logging this information.
    # The issued cookie is HTTP only and specific to the requesting client
    # and will be rejected if submitted by any other client.

    # print(session.cookies)
    # print(response.content)

    # Once we are authenticated, we can perform other queries and make various
    # requests for any API route, using the session that includes our cookie.
    # Here are just a few sample API endpoints:

    routes = [
        # get user information
        "/user",
        # get list of teams
        "/team",
        # learn about team "acme"
        "/team/acme",
        # learn about suite "students" of team "acme"
        "/suite/acme/students",
        # learn about versions submitted for suite "students" of team "acme"
        "/batch/acme/students",
        # learn about testcase "alice" of suite "students"
        "/element/acme/students/alice",
        # see comparison results between version "v5.0" and "v2.0" of suite
        # "students" of team "acme"
        "/batch/acme/students/v5.0/compare/v2.0/students",
        # see comparison results between data points for testcase "alice"
        # in suite "students" of team "acme" between versions "v5.0" and "v2.0"
        "/element/acme/students/alice/compare/v5.0/v2.0/alice/students",
    ]
    for route in routes:
        response = session.get(ApiRoot + route)
        response.raise_for_status()
        print(response.content)

    # Finally, note that the response to some API routes varies depending
    # on the permissions of the user account used during authentication.
    # Consult with the Touca Server API documentation to learn more about
    # the expected Server and/or Team roles for each route.


if __name__ == "__main__":
    main()
