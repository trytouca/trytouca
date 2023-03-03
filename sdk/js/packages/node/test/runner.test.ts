// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

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
  SpyInstance,
  test,
  vi
} from 'vitest';

import { NodeClient } from '../src/client.js';
import touca from '../src/index.js';
import { RunnerOptions } from '../src/options.js';

class Capture {
  private stdout = '';
  private stderr = '';
  private _stdout?: SpyInstance;
  private _stderr?: SpyInstance;
  constructor(start = true) {
    if (start) {
      this.start();
    }
  }
  start() {
    this._stderr = vi.spyOn(process.stderr, 'write').mockImplementation((v) => {
      this.stderr += v;
      return true;
    });
    this._stdout = vi.spyOn(process.stdout, 'write').mockImplementation((v) => {
      this.stdout += v;
      return true;
    });
  }
  stop() {
    const std = { err: this.stderr, out: this.stdout };
    this.stderr = '';
    this.stdout = '';
    this._stderr?.mockRestore();
    this._stdout?.mockRestore();
    return std;
  }
}

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
    const capture = new Capture();
    touca.workflow(
      'some-workflow',
      () => {
        touca.check('some-key', 'some-value');
      },
      { testcases: ['alice'] }
    );
    await touca.run({ team: 'some-team', version: 'v1.0' });
    const std = capture.stop();
    expect(std.out).toContain('');
    expect(std.err).toContain('');
  });
});

describe('main api', () => {
  test('filter workflow', async () => {
    const capture = new Capture();
    const client = new NodeClient();
    client.workflow('some-workflow', () => {
      client.check('some-key', 'some-value');
    });
    client.workflow('some-other-workflow', () => {
      client.check('some-key', 'some-value');
    });
    await client.run({
      team: 'some-team',
      testcases: ['alice'],
      version: 'v1.0',
      workflow_filter: 'some-workflow'
    });
    const std = capture.stop();
    expect(std.out).toContain('Suite: some-workflow/v1.0');
    expect(std.out).not.toContain('Suite: some-other-workflow/v1.0');
    expect(std.err).toEqual('');
  });

  test('missing options', async () => {
    const capture = new Capture();
    const client = new NodeClient();
    client.workflow('some-workflow', () => {
      client.check('some-key', 'some-value');
    });
    await client.run();
    const std = capture.stop();
    expect(std.err).toContain(
      '\nTest failed:\nConfiguration option "version" is missing.\n'
    );
  });

  test('failing test', async () => {
    const capture = new Capture();
    const client = new NodeClient();
    client.workflow(
      'some-workflow',
      () => {
        client.check('some-key', 'some-value');
        throw new Error('sample error');
      },
      { testcases: ['alice'] }
    );
    await client.run({ team: 'some-team', version: 'v1.0' });
    const std = capture.stop();
    expect(std.out).toContain('Suite: some-workflow/v1.0');
    expect(std.out).toContain('- sample error');
    expect(std.out).toContain('Ran all test suites.');
    expect(std.err).toEqual('');
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
      await runSampleWorkflow({
        output_directory,
        save_binary: true,
        team: 'some-team',
        version: 'v1.0'
      });
      const capture = new Capture();
      await runSampleWorkflow({
        no_color: true,
        output_directory,
        save_binary: true,
        team: 'some-team',
        version: 'v1.0'
      });
      const std = capture.stop();
      expect(std.out).toContain('Suite: some-workflow/v1.0');
      expect(std.out).toContain('1.  SKIP  alice');
      expect(std.out).toContain('1 skipped, 1 total');
      expect(std.err).toEqual('');
    });

    test('save json', async () => {
      await runSampleWorkflow({
        output_directory,
        save_json: true,
        team: 'some-team',
        version: 'v1.0'
      });
      const capture = new Capture();
      await runSampleWorkflow({
        no_color: true,
        output_directory,
        save_json: true,
        team: 'some-team',
        version: 'v1.0'
      });
      const std = capture.stop();
      expect(std.out).toContain('Suite: some-workflow/v1.0');
      expect(std.out).toContain('1.  SKIP  alice');
      expect(std.out).toContain('1 skipped, 1 total');
      expect(std.err).toEqual('');
    });
  });
});
