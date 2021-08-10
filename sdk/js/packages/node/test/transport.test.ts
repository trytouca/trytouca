// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NodeClient } from '../src/client';
import * as nock from 'nock';

const config = {
  api_url: 'https://api.example.com/v1/@/some-team/some-suite',
  api_key: 'd1805f97-c594-43fd-a530-97f5fc38da6f',
  version: 'some-version'
};

describe('http transport', () => {
  beforeEach(() => nock.cleanAll());

  test('check basic authentication', async () => {
    nock('https://api.example.com')
      .get('/v1/platform')
      .times(2)
      .reply(200, {
        ready: true
      })
      .post('/v1/client/signin')
      .times(2)
      .reply(200, {
        expiresAt: new Date(),
        token: 'some-token'
      });

    const client = new NodeClient();
    await client.configure(config);
    expect(client.configuration_error()).toEqual('');
    expect(client.is_configured()).toEqual(true);
    // calling configure after handshake should not trigger re-authentication
    client.configure({ concurrency: false });
    // unless it api_key or api_url are changed
    client.configure({ api_key: 'd1805f97-c594-43fd-a530-97f5fc38da6e' });
  });

  test('check wrong api key', async () => {
    nock('https://api.example.com')
      .get('/v1/platform')
      .reply(200, {
        ready: true
      })
      .post('/v1/client/signin')
      .reply(401, {
        errors: ['invalid api key']
      });

    const client = new NodeClient();
    await client.configure(config);
    expect(client.configuration_error()).toContain('API Key Invalid');
    expect(client.is_configured()).toEqual(false);
    // at this point client has a transport object but no token.
    // calling get test cases, post and seal should fail.
    const error = 'client not authenticated';
    await expect(client.seal()).rejects.toThrowError(error);
    await expect(client.post()).rejects.toThrowError(error);
  });

  test('get testcases', async () => {
    nock('https://api.example.com')
      .get('/v1/platform')
      .reply(200, {
        ready: true
      })
      .post('/v1/client/signin')
      .reply(200, {
        expiresAt: new Date(),
        token: 'some-token'
      })
      .get('/v1/element/some-team/some-suite')
      .reply(200, [
        {
          metricsDuration: 10,
          name: 'Some Case',
          slug: 'some-case'
        },
        {
          metricsDuration: 10,
          name: 'Some Other Case',
          slug: 'some-other-case'
        }
      ]);
    const client = new NodeClient();
    await client.configure(config);
    expect(client.configuration_error()).toEqual('');
    expect(client.is_configured()).toEqual(true);
    await expect(client.get_testcases()).resolves.toEqual([
      'Some Case',
      'Some Other Case'
    ]);
  });
});
