#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import json
import os
from touca.client import Client
from tempfile import TemporaryDirectory

def test_empty_client():
    client = Client()
    assert not client.is_configured()
    assert client.configuration_error() == ''
    client.configure()
    assert client.is_configured()
    assert client.configuration_error() == ''
    assert not client.post()
    assert not client.save('some_file')

def test_configure_by_file():
    with TemporaryDirectory() as tmpdirname:
        filepath = os.path.join(tmpdirname, 'some_file')
        with open(filepath, 'wt') as file:
            file.write(json.dumps({'touca': 'hi'}))
        client = Client()
        assert client._configure_by_file(filepath)
        assert client.configuration_error() == ''
