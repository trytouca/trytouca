// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import * as process from 'process';
import { beforeAll, describe, expect, test, vi } from 'vitest';

import { NodeClient } from '../src/client';

describe('basic operations', () => {
  beforeAll(() => {
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  test('add workflow and run', async () => {
    const mock_stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    const client = new NodeClient();
    client.workflow('some-workflow', () => {
      client.check('some-key', 'some-value');
    });
    await client.run();
    expect(mock_stderr).toHaveBeenLastCalledWith(`
Error when running suite "some-workflow":

      Options "team" are required when using this test framework.
      
`);
  });
});
