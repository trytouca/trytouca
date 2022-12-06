// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { gte } from 'semver';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { NodeClient } from '../src/client';

async function makeEmptyClient() {
  const client = new NodeClient();
  client.configure({
    team: 'some-team',
    suite: 'some-suite',
    version: 'some-version'
  });
  client.declare_testcase('some-case');
  return client;
}

async function makeClient(): Promise<NodeClient> {
  const delay = (ms: number) => new Promise((v) => setTimeout(v, ms));
  const courses = ['math', 'english'];
  const client = await makeEmptyClient();
  client.assume('username', 'potter');
  client.check('is_famous', true);
  client.check('tall', 6.1);
  client.check('age', 21);
  client.check('name', 'harry');
  client.check('dob', { year: 2000, month: 1, day: 1 });
  client.check('courses', courses);
  for (const course of courses) {
    client.add_array_element('course-names', course);
    client.add_hit_count('course-count');
  }
  client.add_metric('exam_time', 42);
  client.start_timer('small_time');
  await delay(10);
  client.stop_timer('small_time');
  await client.scoped_timer('scoped_timer', async () => {
    delay(10);
  });
  return client;
}

test('check basic configure', () => {
  const client = new NodeClient();
  expect(client.configuration_error()).toEqual('');
  expect(client.is_configured()).toEqual(false);
  expect(() => {
    client.configure({
      concurrency: true,
      api_url: 'https://api.touca.io/@/team/suite',
      api_key: 'some-key',
      offline: true
    });
  }).not.toThrow();
  expect(client.is_configured()).toEqual(true);
  expect(client.configuration_error()).toEqual('');
});

test('check missing options', () => {
  const client = new NodeClient();
  expect(client.configuration_error()).toEqual('');
  expect(client.is_configured()).toEqual(false);
  expect(() => {
    client.configure({
      concurrency: true,
      api_url: 'https://api.touca.io/@/team',
      api_key: 'some-key',
      offline: true
    });
  }).not.toThrow();
  expect(client.configuration_error()).toEqual(
    'Configuration failed: missing required option(s) "suite"'
  );
  expect(client.is_configured()).toEqual(false);
});

describe('check no-op state', () => {
  test('forget should throw without configure', () => {
    const client = new NodeClient();
    client.declare_testcase('some-case');
    expect(() => {
      client.forget_testcase('some-case');
    }).toThrowError('test case "some-case" was never declared');
  });
  test('transport functions should throw', async () => {
    const client = new NodeClient();
    const error = 'client not configured to perform this operation';
    await expect(client.get_testcases()).rejects.toThrowError(error);
    await expect(client.post()).rejects.toThrowError(error);
    await expect(client.seal()).rejects.toThrowError(error);
  });
});

describe('check saving file', () => {
  let dir = '';

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'touca-js'));
  });

  afterAll(() => {
    const func = gte(process.version, '15.0.0') ? fs.rmSync : fs.rmdirSync;
    func(dir, { recursive: true });
  });

  test('without calling configure', async () => {
    const client = new NodeClient();
    client.declare_testcase('some-case');
    client.check('some-key', 'some-result');
    client.assume('some-other-key', 'some-assertion');
    client.add_metric('some-metric', 10);
    const filepath = path.join(dir, 'some-file');
    await client.save_json(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    expect(content).toEqual('[]');
  });

  test('capture decimal with absolute rule and save as json', async () => {
    const client = await makeEmptyClient();
    client.check('decimal_rule_absolute', 0.76, {
      rule: { type: 'number', mode: 'absolute', min: 0.7 }
    });
    const filepath = path.join(dir, 'some-file');
    await client.save_json(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    expect(content).toContain(
      JSON.stringify([
        {
          key: 'decimal_rule_absolute',
          value: 0.76,
          rule: { type: 'number', mode: 'absolute', min: 0.7 }
        }
      ])
    );
  });

  test('capture decimal with relative rule and save as json', async () => {
    const client = await makeEmptyClient();
    client.check('decimal_rule_relative', 0.76, {
      rule: { type: 'number', mode: 'relative', max: 0.1, percent: true }
    });
    const filepath = path.join(dir, 'some-file');
    await client.save_json(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    expect(content).toContain(
      JSON.stringify([
        {
          key: 'decimal_rule_relative',
          value: 0.76,
          rule: { type: 'number', mode: 'relative', max: 0.1, percent: true }
        }
      ])
    );
  });

  test('capture decimal with rule and save as binary', async () => {
    const client = await makeEmptyClient();
    client.check('decimal_rule_absolute', 0.76, {
      rule: { type: 'number', mode: 'absolute', min: 0.7 }
    });
    client.check('decimal_rule_relative', 0.76, {
      rule: { type: 'number', mode: 'relative', max: 0.1, percent: true }
    });
    const filepath = path.join(dir, 'some-file');
    await client.save_binary(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'binary' });
    expect(content.length).not.toEqual(0);
  });

  test('capture external file and save as json', async () => {
    const client = await makeEmptyClient();
    const externalFile = path.join(dir, 'some_external_file');
    fs.writeFileSync(externalFile, 'hello');
    client.checkFile('some_external_file', externalFile);
    const filepath = path.join(dir, 'some-file');
    await client.save_json(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    expect(content).toContain(
      JSON.stringify([{ key: 'some_external_file', value: externalFile }])
    );
  });

  test('capture external file and save as binary', async () => {
    const client = await makeEmptyClient();
    const externalFile = path.join(dir, 'some_external_file');
    fs.writeFileSync(externalFile, 'hello');
    client.checkFile('some_external_file', externalFile);
    const filepath = path.join(dir, 'some-file');
    await client.save_binary(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'binary' });
    expect(content.length).not.toEqual(0);
  });

  test('capture blob and save as json', async () => {
    const client = await makeEmptyClient();
    client.check('some_blob', Buffer.from('hello'));
    const filepath = path.join(dir, 'some-file');
    await client.save_json(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    expect(content).toContain(
      JSON.stringify([{ key: 'some_blob', value: 'binary' }])
    );
  });

  test('capture blob and save as binary', async () => {
    const client = await makeEmptyClient();
    client.check('some_blob', Buffer.from('hello'));
    const filepath = path.join(dir, 'some-file');
    await client.save_binary(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'binary' });
    expect(content.length).not.toEqual(0);
  });

  test('after calling forget', async () => {
    const client = await makeEmptyClient();
    client.check('some-key', 'some-value');
    client.forget_testcase('some-case');
    const filepath = path.join(dir, 'some-file');
    await client.save_json(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    expect(content).toEqual('[]');
  });

  test('all cases in json format', async () => {
    const client = new NodeClient();
    client.configure();
    expect(client.is_configured()).toEqual(true);
    expect(client.configuration_error()).toEqual('');
    client.declare_testcase('some-case');
    client.check('some-key', 'some-result');
    client.declare_testcase('some-other-case');
    client.assume('some-other-key', 'some-assertion');
    client.declare_testcase('yet-another-case');
    client.add_metric('some-metric', 10);
    const filepath = path.join(dir, 'some-file');
    await client.save_json(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    const parsed = JSON.parse(content);
    expect(parsed).toHaveLength(3);
    expect(content).toContain('"testcase":"some-case"');
    expect(content).toContain('"testcase":"some-other-case"');
    expect(content).toContain('"testcase":"yet-another-case"');
  });

  test('results in json format', async () => {
    const client = await makeClient();
    const filepath = path.join(dir, 'some-json-file');
    await client.save_json(filepath, ['some-case']);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    const parsed = JSON.parse(content)[0].results as {
      key: string;
      value: unknown;
    }[];
    const results = new Map(parsed.map((kvp) => [kvp.key, kvp.value]));
    expect(results.get('is_famous')).toBe(true);
    expect(results.get('tall')).toBe(6.1);
    expect(results.get('age')).toBe(21);
    expect(results.get('name')).toBe('harry');
    expect(results.get('dob')).toEqual({ year: 2000, month: 1, day: 1 });
    expect(results.get('courses')).toEqual(['math', 'english']);
    expect(results.get('course-names')).toEqual(['math', 'english']);
    expect(results.get('course-count')).toEqual(2);
  });

  test('some cases in json format', async () => {
    const client = new NodeClient();
    client.configure();
    expect(client.is_configured()).toEqual(true);
    client.declare_testcase('some-case');
    client.check('some-key', 'some-result');
    client.declare_testcase('some-other-case');
    client.assume('some-other-key', 'some-assertion');
    client.declare_testcase('yet-another-case');
    client.add_metric('some-metric', 10);
    const filepath = path.join(dir, 'some-file');
    await client.save_json(filepath, ['some-case']);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    const parsed = JSON.parse(content);
    expect(parsed).toHaveLength(1);
    expect(content).toContain('"testcase":"some-case"');
    expect(content).not.toContain('"testcase":"some-other-case"');
    expect(content).not.toContain('"testcase":"yet-another-case"');
  });

  test('all cases in binary format', async () => {
    const client = await makeClient();
    const filepath = path.join(dir, 'some-file');
    await client.save_binary(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'binary' });
    expect(content.length).not.toEqual(0);
  });
});
