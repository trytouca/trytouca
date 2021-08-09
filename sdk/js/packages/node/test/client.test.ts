// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NodeClient } from '../src/client';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

class DateOfBirth {
  constructor(
    public readonly year: number,
    public readonly month: number,
    public readonly day: number
  ) {}
}

async function make_client(): Promise<NodeClient> {
  const delay = (ms: number) => new Promise((v) => setTimeout(v, ms));
  const courses = ['math', 'english'];
  const client = new NodeClient();
  client.configure({
    team: 'some-team',
    suite: 'some-suite',
    version: 'some-version'
  });
  client.declare_testcase('some-case');
  client.add_assertion('username', 'potter');
  client.add_result('is_famous', true);
  client.add_result('tall', 6.1);
  client.add_result('age', 21);
  client.add_result('name', 'harry');
  client.add_result('dob', new DateOfBirth(2000, 1, 1));
  client.add_result('courses', courses);
  for (const course of courses) {
    client.add_array_element('course-names', course);
    client.add_hit_count('course-count');
  }
  client.add_metric('exam_time', 42);
  client.start_timer('small_time');
  await delay(10);
  client.stop_timer('small_time');
  await client.scoped_timer('scoped_timer', () => {
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
      api_url: 'https://api.touca.io/@/team/suite/v1',
      api_key: 'some-key',
      offline: true
    });
  }).not.toThrow();
  expect(client.is_configured()).toEqual(true);
});

test('check missing options', () => {
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
  expect(client.configuration_error()).toEqual(
    'Configuration failed: missing required option(s) "version"'
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
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('all cases in json format', async () => {
    const client = new NodeClient();
    client.configure({});
    expect(client.is_configured()).toEqual(true);
    client.declare_testcase('some-case');
    client.add_result('some-key', 'some-result');
    client.declare_testcase('some-other-case');
    client.add_assertion('some-other-key', 'some-assertion');
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

  test('some cases in json format', async () => {
    const client = new NodeClient();
    client.configure({});
    expect(client.is_configured()).toEqual(true);
    client.declare_testcase('some-case');
    client.add_result('some-key', 'some-result');
    client.declare_testcase('some-other-case');
    client.add_assertion('some-other-key', 'some-assertion');
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

  test('without calling configure', async () => {
    const client = new NodeClient();
    client.declare_testcase('some-case');
    client.add_result('some-key', 'some-result');
    client.add_assertion('some-other-key', 'some-assertion');
    client.add_metric('some-metric', 10);
    const filepath = path.join(dir, 'some-file');
    await client.save_json(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    expect(content).toEqual('[]');
  });

  test('after calling forget', async () => {
    const client = await make_client();
    client.forget_testcase('some-case');
    const filepath = path.join(dir, 'some-file');
    await client.save_json(filepath);
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
    expect(content).toEqual('[]');
  });
});
