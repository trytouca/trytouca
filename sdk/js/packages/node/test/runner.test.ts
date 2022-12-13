// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { gte } from 'semver';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest';

import { NodeClient } from '../src/client.js';
import touca from '../src/index.js';
import { RunnerOptions } from '../src/options.js';

async function runSampleWorkflow(options: RunnerOptions) {
  const client = new NodeClient();
  client.workflow(
    'some-workflow',
    () => {
      client.check('some-key', 'some-value');
    },
    { testcases: ['alice'] }
  );
  await client.run(options);
}

describe('index', () => {
  beforeAll(() => {
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  test('basic', async () => {
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    touca.workflow(
      'some-workflow',
      () => {
        touca.check('some-key', 'some-value');
      },
      { testcases: ['alice'] }
    );
    await touca.run({ team: 'some-team', version: 'v1.0' });
    expect(stderr).not.toHaveBeenCalled();
    expect(stdout).toHaveBeenCalled();
  });
});

describe('main api', () => {
  test('missing options', async () => {
    let stderr = '';
    vi.spyOn(process.stderr, 'write').mockImplementation((v) => {
      stderr += v;
      return true;
    });
    const client = new NodeClient();
    client.workflow('some-workflow', () => {
      client.check('some-key', 'some-value');
    });
    await client.run();
    expect(stderr).toContain(
      '\nTest failed:\nrequired option "version" is missing\n'
    );
  });

  test('failing test', async () => {
    let stderr = '';
    let stdout = '';
    vi.spyOn(process.stderr, 'write').mockImplementation((v) => {
      stderr += v;
      return true;
    });
    vi.spyOn(process.stdout, 'write').mockImplementation((v) => {
      stdout += v;
      return true;
    });
    const client = new NodeClient();
    client.workflow(
      'some-workflow',
      () => {
        client.check('some-key', 'some-value');
        throw new Error('sample failure reason');
      },
      { testcases: ['alice'] }
    );
    await client.run({ team: 'some-team', version: 'v1.0' });
    expect(stdout).toContain('Suite: some-workflow/v1.0');
    expect(stdout).toContain('- sample failure reason');
    expect(stdout).toContain('Ran all test suites.');
    expect(stderr).toEqual('');
  });

  describe('skipped test', async () => {
    let output_directory = '';

    beforeEach(async () => {
      output_directory = fs.mkdtempSync(path.join(os.tmpdir(), 'touca-js'));
    });
    afterEach(() => {
      const func = gte(process.version, '15.0.0') ? fs.rmSync : fs.rmdirSync;
      func(output_directory, { recursive: true });
    });

    test('save binary', async () => {
      let stderr = '';
      let stdout = '';
      await runSampleWorkflow({
        output_directory,
        save_binary: true,
        team: 'some-team',
        version: 'v1.0'
      });
      vi.spyOn(process.stderr, 'write').mockImplementation((v) => {
        stderr += v;
        return true;
      });
      vi.spyOn(process.stdout, 'write').mockImplementation((v) => {
        stdout += v;
        return true;
      });
      await runSampleWorkflow({
        output_directory,
        save_binary: true,
        team: 'some-team',
        version: 'v1.0'
      });
      expect(stdout).toContain('Suite: some-workflow/v1.0');
      expect(stdout).toContain('1.  SKIP  alice');
      expect(stdout).toContain('1 skipped, 1 total');
      expect(stderr).toEqual('');
    });

    test('save json', async () => {
      let stderr = '';
      let stdout = '';
      await runSampleWorkflow({
        output_directory,
        save_json: true,
        team: 'some-team',
        version: 'v1.0'
      });
      vi.spyOn(process.stderr, 'write').mockImplementation((v) => {
        stderr += v;
        return true;
      });
      vi.spyOn(process.stdout, 'write').mockImplementation((v) => {
        stdout += v;
        return true;
      });
      await runSampleWorkflow({
        output_directory,
        save_json: true,
        team: 'some-team',
        version: 'v1.0'
      });
      expect(stdout).toContain('Suite: some-workflow/v1.0');
      expect(stdout).toContain('1.  SKIP  alice');
      expect(stdout).toContain('1 skipped, 1 total');
      expect(stderr).toEqual('');
    });
  });
});
