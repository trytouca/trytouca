// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import nock from 'nock';
import { beforeEach, describe, expect, test } from 'vitest';

import { NodeClient } from '../src/client';
import { ToucaError } from '../src/options';

const config = {
  api_url: 'https://api.example.com/v1/@/some-team/some-suite',
  api_key: 'd1805f97-c594-43fd-a530-97f5fc38da6f',
  version: 'some-version'
};

describe('check authentication', () => {
  beforeEach(() => nock.cleanAll());

  test('check basic authentication', async () => {
    nock('https://api.example.com')
      .post('/v1/client/signin')
      .times(2)
      .reply(200, {
        expiresAt: new Date(),
        token: 'some-token'
      });

    const client = new NodeClient();
    expect(client.configure(config)).resolves;
    // calling configure after handshake should not trigger re-authentication
    expect(client.configure({ concurrency: false })).resolves;
    // unless it api_key or api_url are changed
    expect(
      client.configure({ api_key: 'd1805f97-c594-43fd-a530-97f5fc38da6e' })
    ).resolves;
  });

  test('check wrong api key', async () => {
    nock('https://api.example.com')
      .post('/v1/client/signin')
      .reply(401, {
        errors: ['invalid api key']
      });

    const client = new NodeClient();
    expect(client.configure(config)).rejects.toThrowError('API Key Invalid');
    // at this point client has a transport object but no token.
    // calling post and seal should fail.
    const error = new ToucaError('client_not_configured');
    expect(client.post()).rejects.toThrowError(error);
    expect(client.seal()).rejects.toThrowError(error);
  });
});

describe('check failure errors', () => {
  let scope: nock.Scope;
  beforeEach(() => {
    nock.cleanAll();
    scope = nock('https://api.example.com')
      .get('/v1/platform')
      .reply(200, {
        ready: true
      })
      .post('/v1/client/signin')
      .reply(200, {
        expiresAt: new Date(),
        token: 'some-token'
      });
  });

  test('when post fails', async () => {
    scope.post('/v1/client/submit').reply(400, {
      status: 400,
      errors: ['bad submission']
    });
    const client = new NodeClient();
    await client.configure(config);
    expect(client.post()).rejects.toThrowError('Failed to submit test results');
  });

  test('when seal fails', async () => {
    scope.post('/v1/batch/some-team/some-suite/some-version/seal2').reply(404, {
      errors: ['batch not found'],
      status: 404
    });
    const client = new NodeClient();
    await client.configure(config);
    expect(client.seal()).rejects.toThrowError(new ToucaError('seal_failed'));
  });
});
