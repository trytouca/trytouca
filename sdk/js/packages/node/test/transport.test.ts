// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import nock from 'nock';
import { beforeEach, describe, expect, test } from 'vitest';

import { NodeClient } from '../src/client';
import { ToucaError } from '../src/options';
import { Transport } from '../src/transport';

const config = {
  api_url: 'https://api.example.com/v1/@/some-team/some-suite',
  api_key: 'd1805f97-c594-43fd-a530-97f5fc38da6f',
  version: 'some-version'
};

describe('check authentication', () => {
  beforeEach(() => nock.cleanAll());

  test('http', async () => {
    const api_url = 'http://api.example.com';
    nock(api_url).post('/client/verify').times(1).reply(204);
    const transport = new Transport();
    await transport.configure(api_url, 'some-key');
  });

  test('invalid key', async () => {
    const api_url = 'https://api.example.com';
    nock(api_url)
      .post('/client/verify')
      .times(1)
      .reply(403, {
        errors: ['team unauthorized']
      });
    const transport = new Transport();
    expect(transport.configure(api_url, 'some-key')).rejects.toThrowError(
      new ToucaError('auth_invalid_response', 403)
    );
  });

  test('multiple auth', async () => {
    const api_url = 'https://api.example.com';
    nock(api_url).post('/client/verify').times(1).reply(204, {});
    const transport = new Transport();
    await transport.configure(api_url, 'some-key');
    expect(transport.configure(api_url, 'some-key')).resolves;
  });

  test('check basic authentication', async () => {
    nock('https://api.example.com')
      .post('/v1/client/verify')
      .times(2)
      .reply(204);

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
      .post('/v1/client/verify')
      .reply(401, {
        errors: ['api key invalid']
      });

    const client = new NodeClient();
    expect(client.configure(config)).rejects.toThrowError(
      new ToucaError('auth_invalid_key')
    );
    // calling post and seal should fail.
    const error = new ToucaError('capture_not_configured');
    expect(client.post()).rejects.toThrowError(error);
    expect(client.seal()).rejects.toThrowError(error);
  });
});

describe('check failure errors', () => {
  let scope: nock.Scope;
  beforeEach(() => {
    nock.cleanAll();
    scope = nock('https://api.example.com')
      .post('/v1/client/verify')
      .reply(204);
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
    scope.post('/v1/batch/some-team/some-suite/some-version/seal').reply(404, {
      errors: ['batch not found'],
      status: 404
    });
    const client = new NodeClient();
    await client.configure(config);
    expect(client.seal()).rejects.toThrowError(
      new ToucaError('transport_seal')
    );
  });
});
