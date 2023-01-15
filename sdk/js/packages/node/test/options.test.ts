// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import fs from 'node:fs';

import nock from 'nock';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  NodeOptions,
  RunnerOptions,
  ToucaError,
  updateCoreOptions,
  updateRunnerOptions
} from '../src/options';

test('ToucaError', () => {
  const err = new ToucaError('config_option_missing', 'version');
  expect(err).instanceOf(Error);
  expect(err.message).contains('Configuration option "version" is missing.');
});

test('pass when empty options are passed', async () => {
  const existing: NodeOptions = {};
  const status = await updateCoreOptions(existing);
  expect(status).toEqual(true);
  expect(existing).toEqual({ concurrency: true, offline: true });
});

test('fail when file is missing', () => {
  expect(
    updateRunnerOptions({ config_file: 'some/path' })
  ).rejects.toThrowError(new ToucaError('config_file_missing', 'some/path'));
});

test('fail when directory is passed as file', () => {
  vi.spyOn(fs, 'statSync').mockReturnValueOnce({
    isFile: () => false
  } as fs.Stats);
  expect(
    updateRunnerOptions({ config_file: 'some/path/' })
  ).rejects.toThrowError(new ToucaError('config_file_missing', 'some/path/'));
});

describe('when valid config file is given', () => {
  beforeEach(() => {
    vi.spyOn(fs, 'statSync').mockReturnValueOnce({
      isFile: () => true
    } as fs.Stats);
  });

  test('fail if params are missing', () => {
    const content = JSON.stringify({ key: 'value' });
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(content);
    expect(
      updateRunnerOptions({ config_file: 'some/path' })
    ).rejects.toThrowError(new ToucaError('config_file_invalid', 'some/path'));
  });

  test('fail if params have unexpected types', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(
      JSON.stringify({ touca: { offline: 'some-string' } })
    );
    expect(
      updateRunnerOptions({ config_file: 'some/path' })
    ).rejects.toThrowError(new ToucaError('config_option_invalid', 'offline'));
  });

  test('pass if params make sense', async () => {
    const content = {
      key: 'value',
      touca: {
        offline: true,
        team: 'some-team',
        testcases: ['some-testcase'],
        version: 'some-version'
      }
    };
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(content));
    const options: RunnerOptions = {
      config_file: 'some/path',
      workflows: [{ suite: 'some-suite', callback: (tc: string) => {} }]
    };
    await updateRunnerOptions(options);
    expect(options.team).equals('some-team');
    expect(options.workflows).toBeDefined();
    expect(options.workflows).toHaveLength(1);
    if (options.workflows) {
      expect(options.workflows[0].version).toEqual('some-version');
    }
  });
});

describe('remote options', () => {
  const api_url = 'https://api.example.com';
  beforeEach(() => {
    nock(api_url).post('/client/verify').times(1).reply(204);
  });
  test('working', async () => {
    nock(api_url)
      .post('/client/options')
      .times(1)
      .reply(200, [
        {
          team: 'some-team',
          suite: 'some-suite',
          version: 'some-version',
          testcases: ['alice', 'bob', 'charlie']
        }
      ]);
    const options: RunnerOptions = {
      api_key: 'some-key',
      api_url,
      team: 'some-team',
      workflows: [
        {
          callback: () => {},
          suite: 'some-suite'
        }
      ]
    };
    await updateRunnerOptions(options);
    expect(options).not.toHaveProperty('suite');
    expect(options).not.toHaveProperty('version');
    if (options.workflows) {
      expect(options.workflows[0].version).toEqual('some-version');
    }
  });
  test('invalid response', async () => {
    nock(api_url)
      .post('/client/options')
      .times(1)
      .reply(404, [{ errors: ['team not found'] }]);
    const options: RunnerOptions = {
      api_key: 'some-key',
      api_url,
      team: 'some-team',
      workflows: [
        {
          callback: () => {},
          suite: 'some-suite'
        }
      ]
    };
    try {
      await updateRunnerOptions(options);
    } catch (err) {
      expect(err).toEqual(new ToucaError('transport_options'));
    }
  });
});

describe('when api url is given', () => {
  test('check default protocol', async () => {
    const options: NodeOptions = {
      api_key: 'some-key',
      api_url: 'api.touca.io',
      offline: true,
      suite: 'some-suite',
      team: 'some-team',
      version: 'some-version'
    };
    const status = await updateCoreOptions(options);
    expect(status).toEqual(true);
    expect(options.api_url).toEqual('https://api.touca.io/');
    expect(options.team).toEqual('some-team');
    expect(options.suite).toEqual('some-suite');
    expect(options.version).toEqual('some-version');
  });

  test('check long format', async () => {
    const options: NodeOptions = {
      api_key: 'some-key',
      api_url: 'http://localhost:8080//v2//@/team//suite/version/',
      offline: true
    };
    const status = await updateCoreOptions(options);
    expect(status).toEqual(true);
    expect(options.api_url).toEqual('http://localhost:8080/v2');
    expect(options.team).toEqual('team');
    expect(options.suite).toEqual('suite');
    expect(options.version).toEqual('version');
  });

  test('check short format', async () => {
    const options: NodeOptions = {
      api_key: 'some-key',
      api_url: 'http://127.0.0.1/api',
      offline: true
    };
    const status = await updateCoreOptions(options);
    expect(status).toEqual(true);
    expect(options.api_key).toEqual('some-key');
    expect(options.api_url).toEqual('http://127.0.0.1/api');
    expect(options.team).toBeUndefined();
    expect(options.suite).toBeUndefined();
    expect(options.version).toBeUndefined();
  });

  test('accepting conflicting input', async () => {
    const options: NodeOptions = {
      api_key: 'some-key',
      api_url: 'http://localhost:8080/@/team/suite/version',
      suite: 'some-other-version',
      offline: true
    };
    const status = await updateCoreOptions(options);
    expect(status).toEqual(true);
    expect(options.api_key).toEqual('some-key');
    expect(options.api_url).toEqual('http://localhost:8080/');
    expect(options.team).toEqual('team');
    expect(options.suite).toEqual('suite');
    expect(options.version).toEqual('version');
  });
});

describe('when environment variables are present', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('they should take effect', async () => {
    process.env.TOUCA_API_KEY = 'some-api-key';
    process.env.TOUCA_API_URL = 'https://api.touca.io/@/team/suite/';
    process.env.TOUCA_TEST_VERSION = 'version';
    const options: NodeOptions = { offline: true };
    const status = await updateCoreOptions(options);
    expect(status).toEqual(true);
    expect(options.api_key).toEqual('some-api-key');
    expect(options.api_url).toEqual('https://api.touca.io/');
    expect(options.version).toEqual('version');
    expect(options.team).toEqual('team');
    expect(options.suite).toEqual('suite');
  });

  test('they should take precedence', async () => {
    process.env.TOUCA_API_KEY = 'some-api-key';
    process.env.TOUCA_API_URL = 'https://api.touca.io/@/team/suite/';
    process.env.TOUCA_TEST_VERSION = 'version';
    const options: NodeOptions = {
      api_key: 'some-key',
      api_url: 'some-url',
      version: 'some_other_version',
      offline: true
    };
    const status = await updateCoreOptions(options);
    expect(status).toEqual(true);
    expect(options.api_key).toEqual('some-api-key');
    expect(options.api_url).toEqual('https://api.touca.io/');
    expect(options.version).toEqual('version');
    expect(options.team).toEqual('team');
    expect(options.suite).toEqual('suite');
  });
});
