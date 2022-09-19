// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import * as process from 'process';

import { NodeClient } from '../src/client';

describe('basic operations', () => {
  beforeAll(() => {
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  test('add workflow and run', async () => {
    const mock_stderr = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation();
    const client = new NodeClient();
    client.workflow('some-workflow', () => {
      client.check('some-key', 'some-value');
    });
    await client.run();
    expect(mock_stderr).toHaveBeenLastCalledWith(`
Error when running suite "some-workflow":

      Options "team", "version" are required when using this test framework.
      
`);
  });
});
