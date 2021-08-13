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
    expect(mock_stdout).toHaveBeenCalledWith(
      `Touca encountered an error when executing this test:\nOptions "team", "suite", "version" are required when using this test framework.`
    );
  });
});
