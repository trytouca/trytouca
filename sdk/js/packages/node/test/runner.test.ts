// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import * as process from 'process';

import { NodeClient } from '../src/client';

describe('basic operations', () => {
  beforeAll(() => {
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  test('add workflow and run', async () => {
    const mock_stdout = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation();
    const client = new NodeClient();
    client.workflow('some-workflow', () => {
      client.add_result('some-key', 'some-value');
    });
    await client.run();
    const prefix = 'Touca encountered an error when executing this test';
    const message = `
      Options "team", "suite", "version" are required when using this test framework.
      `;
    expect(mock_stdout).toHaveBeenCalledWith(`${prefix}:\n${message}\n`);
  });
});
