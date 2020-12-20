#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

#!/usr/bin/env python

"""
This script provides an example on how to authenticate and interact
with Weasel Platform API v1.2.
"""

import requests

# URL to entry point of the Weasel Platform API
# In on-prem deployments, this URL may be of the form
# `https://weasel.your.company/api

WeaselApiRoot="https://getweasel.com/api"

# Credentials of the user account on whose behalf the client authenticates.
# Note: there is an open ticket for v1.3.0 that allows authentication via
# API Keys instead of username/password combination.
ClientUsername="pghorbanzade"
ClientPassword="Weasel$123"

def main():
    """
    In Weasel v1.2, clients are expected to authenticate with Platform API
    before they can make requests to access or modify information.
    """

    # We perform authentication by submitting username and password.
    # After successful authentication, the platform issues an access
    # token in form of an HTTP-only cookie that may be sent along in
    # subsequent requests. The platform indicates expiration time of
    # this token in the field "expiresAt" of its JSON response.
    #
    # Access tokens are valid for 30 days since their time of issue.
    # They can be renewed at any time for long-running applications.
    # See API documentation for "/auth/extend" for more information.
    # They can be purged at any time if needed.
    # See API documentation for "/auth/signout" for more information.
    # But in small one-time scripts, we recommend that the client asks
    # for an access token every time during application startup process.
    # Weasel API may choose to re-use an already issued access token.

    session = requests.Session()
    response = session.post(
        url=WeaselApiRoot + "/auth/signin",
        json={'username': ClientUsername, 'password': ClientPassword})

    # we expect a response status of 200. In more serious applications,
    # consider checking response.status_code instead.
    response.raise_for_status()

    # Curious engineers can view the issued token and the JSON response.
    # But we generally advise against printing or logging this information.
    # The issued cookie is HTTP only and specific to the requesting client
    # and will be rejected if submitted by any other client.

    print(session.cookies)
    print(response.content)

    # Once we are authenticated, we can perform other queries and make
    # requests for any API route, using the session that includes our
    # cookie.

    response = session.get(WeaselApiRoot + "/user")
    response.raise_for_status()
    print(response.content)

    # Finally, note that the response to some API routes varies depending
    # on the permissions of the user account used during authentication.
    # Consult with Platform API documentation to learn more about the
    # expected Platform and/or Team roles for each route.

if __name__ == '__main__':
    main()
