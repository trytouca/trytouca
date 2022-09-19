// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import * as fs from 'fs';

import { NodeOptions, update_options } from '../src/options';

test('pass when empty options are passed', () => {
  const existing: NodeOptions = {};
  update_options(existing, {});
  expect(existing).toEqual({ concurrency: true, version: 'unknown' });
});

test('fail when file is missing', () => {
  const incoming = { file: 'some/path' };
  expect(() => {
    update_options({}, incoming);
  }).toThrowError('config file not found');
});

test('fail when directory is passed as file', () => {
  const incoming = { file: 'some/path/' };
  jest
    .spyOn(fs, 'statSync')
    .mockReturnValueOnce({ isFile: () => false } as fs.Stats);
  expect(() => {
    update_options({}, incoming);
  }).toThrowError('config file not found');
});

describe('when valid config file is given', () => {
  beforeEach(() => {
    jest
      .spyOn(fs, 'statSync')
      .mockReturnValueOnce({ isFile: () => true } as fs.Stats);
  });

  test('fail if params are missing', () => {
    const incoming = { file: 'some/path' };
    const content = { key: 'value' };
    jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(content));
    expect(() => {
      update_options({}, incoming);
    }).toThrowError('file is missing JSON field: "touca"');
  });

  test('fail if params have unexpected types', () => {
    const incoming = { file: 'some/path' };
    const content = { touca: { offline: 'some-string' } };
    jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(content));
    expect(() => {
      update_options({}, incoming);
    }).toThrowError('parameter "offline" has unexpected type');
  });

  test('pass if params make sense', () => {
    const incoming = { file: 'some/path' };
    const content = {
      key: 'value',
      touca: {
        team: 'some-team',
        suite: 'some-suite',
        version: 'some-version',
        offline: true
      }
    };
    jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(content));
    const existing: NodeOptions = {};
    expect(() => {
      update_options(existing, incoming);
    }).not.toThrow();
    expect(existing).toEqual({
      concurrency: true,
      ...content.touca
    });
  });
});

describe('when api url is given', () => {
  test('check default protocol', () => {
    const existing: NodeOptions = {};
    const incoming: NodeOptions = {
      api_key: 'some-key',
      api_url: 'api.touca.io',
      team: 'some-team',
      suite: 'some-suite',
      version: 'some-version'
    };
    expect(() => update_options(existing, incoming)).not.toThrow();
    expect(existing.api_url).toEqual('https://api.touca.io/');
    expect(existing.team).toEqual(incoming.team);
    expect(existing.suite).toEqual(incoming.suite);
    expect(existing.version).toEqual(incoming.version);
  });

  test('check long format', () => {
    const existing: NodeOptions = {};
    const incoming: NodeOptions = {
      api_key: 'some-key',
      api_url: 'http://localhost:8080//v2//@/team//suite/version/'
    };
    expect(() => update_options(existing, incoming)).not.toThrow();
    expect(existing.api_url).toEqual('http://localhost:8080/v2');
    expect(existing.team).toEqual('team');
    expect(existing.suite).toEqual('suite');
    expect(existing.version).toEqual('version');
  });

  test('check short format', () => {
    const existing: NodeOptions = {};
    const incoming: NodeOptions = {
      api_key: 'some-key',
      api_url: 'http://127.0.0.1/api'
    };
    expect(() => update_options(existing, incoming)).toThrowError(
      'missing required option(s) "team", "suite"'
    );
    expect(existing.api_url).toEqual('http://127.0.0.1/api');
  });

  test('reject conflicting input', () => {
    const existing: NodeOptions = {};
    const incoming: NodeOptions = {
      api_key: 'some-key',
      api_url: 'http://localhost:8080/@/team/suite/version',
      suite: 'some-other-version'
    };
    expect(() => update_options(existing, incoming)).toThrowError(
      'option "suite" is in conflict with provided api_url'
    );
    expect(existing.api_url).toEqual('http://localhost:8080/');
  });
});

describe('when environment variables are present', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('they should take effect', () => {
    process.env.TOUCA_API_KEY = 'some-api-key';
    process.env.TOUCA_API_URL = 'https://api.touca.io/@/team/suite/';
    process.env.TOUCA_TEST_VERSION = 'version';
    const existing: NodeOptions = {};
    const incoming: NodeOptions = {};
    expect(() => update_options(existing, incoming)).not.toThrow();
    expect(existing).toEqual({
      api_key: 'some-api-key',
      api_url: 'https://api.touca.io/',
      concurrency: true,
      team: 'team',
      suite: 'suite',
      version: 'version'
    });
  });

  test('they should take precedence', () => {
    process.env.TOUCA_API_KEY = 'some-api-key';
    process.env.TOUCA_API_URL = 'https://api.touca.io/@/team/suite/';
    process.env.TOUCA_TEST_VERSION = 'version';
    const existing: NodeOptions = {};
    const incoming: NodeOptions = {
      api_key: 'some-key',
      api_url: 'some-url',
      version: 'some_other_version'
    };
    expect(() => update_options(existing, incoming)).not.toThrow();
    expect(existing).toEqual({
      api_key: 'some-api-key',
      api_url: 'https://api.touca.io/',
      concurrency: true,
      team: 'team',
      suite: 'suite',
      version: 'version'
    });
  });
});
