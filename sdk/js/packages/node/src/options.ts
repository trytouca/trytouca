// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import * as fs from 'fs';

/**
 *
 */
export interface NodeOptions {
  /**
   * API Key issued by the Touca server that
   * identifies who is submitting the data. Since the value should be
   * treated as a secret, we recommend that you pass it as an environment
   * variable `TOUCA_API_KEY` instead.
   */
  api_key?: string;

  /**
   * URL to the Touca server API. Can be provided either in long
   * format like `https://api.touca.io/@/myteam/mysuite/version` or in short
   * format like `https://api.touca.io`. If the team, suite, or version are
   * specified, you do not need to specify them separately.
   */
  api_url?: string;

  /**
   * determines whether client should connect with the Touca server during
   * the configuration. Defaults to `false` when `api_url` or `api_key` are
   * provided.
   */
  offline?: boolean;

  /**
   * slug of the suite on the Touca server that corresponds to your
   * workflow under test.
   */
  suite?: string;

  /** slug of your team on the Touca server. */
  team?: string;

  /** version of your workflow under test. */
  version?: string;

  /**
   * determines whether the scope of test case declaration is bound to
   * the thread performing the declaration, or covers all other threads.
   * Defaults to `True`.
   *
   * If set to `True`, when a thread calls {@link declare_testcase}, all
   * other threads also have their most recent test case changed to the
   * newly declared test case and any subsequent call to data capturing
   * functions such as {@link add_result} will affect the newly declared
   * test case.
   */
  concurrency?: boolean;

  /**
   * Path to a configuration file in JSON format with a
   * top-level "touca" field that may list any number of configuration
   * parameters for this function. When used alongside other parameters,
   * those parameters would override values specified in the file.
   */
  file?: string;
}

/**
 *
 */
function _apply_config_file(incoming: NodeOptions): void {
  if (!incoming.file) {
    return;
  }
  // starting Node v14, statSync accepts { throwIfNoEntry: false } as a second
  // parameter. We are intentionally not using this option to support Node v12.
  try {
    if (!fs.statSync(incoming.file).isFile()) {
      throw new Error('config file not found');
    }
  } catch (err) {
    throw new Error('config file not found');
  }
  const content = fs.readFileSync(incoming.file, { encoding: 'utf8' });
  const parsed = JSON.parse(content);
  if (!parsed.touca) {
    throw new Error('file is missing JSON field: "touca"');
  }
  const config: NodeOptions = parsed.touca;
  for (const key of Object.keys(config) as (keyof NodeOptions)[]) {
    if (!(key in incoming)) {
      incoming[key] = parsed['touca'][key];
    }
  }
}

/**
 *
 */
function _apply_arguments(existing: NodeOptions, incoming: NodeOptions): void {
  type Param = NodeOptions[keyof NodeOptions];
  const inputs: {
    params: (keyof NodeOptions)[];
    validate: (x: Param) => boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform: (x: Param) => any;
  }[] = [
    {
      params: ['team', 'suite', 'version', 'api_key', 'api_url'],
      validate: (x) => typeof x === 'string',
      transform: (x) => x
    },
    {
      params: ['offline', 'concurrency'],
      validate: (x) => typeof x === 'boolean',
      transform: (x) => x
    }
  ];
  for (const input of inputs) {
    for (const param of input.params) {
      if (!(param in incoming)) {
        continue;
      }
      const value = incoming[param];
      if (value === undefined) {
        continue;
      }
      if (!input.validate(value)) {
        throw new Error(`parameter "${param}" has unexpected type`);
      }
      existing[param] = input.transform(value);
    }
  }
}

/**
 *
 */
function _apply_environment_variables(existing: NodeOptions): void {
  const options: Record<string, 'api_key' | 'api_url' | 'version'> = {
    TOUCA_API_KEY: 'api_key',
    TOUCA_API_URL: 'api_url',
    TOUCA_TEST_VERSION: 'version'
  };
  for (const env in options) {
    const value = process.env[env];
    if (value) {
      const key = options[env];
      existing[key] = value;
    }
  }
}

/**
 *
 */
function _reformat_parameters(existing: NodeOptions): void {
  if (!existing.concurrency) {
    existing.concurrency = true;
  }
  const input_url = existing.api_url;
  if (!input_url) {
    return;
  }
  const has_protocol = ['http', 'https'].some((v) => input_url.startsWith(v));
  const url = new URL(has_protocol ? input_url : 'https://' + input_url);
  const pathname = url.pathname
    .split('/@/')
    .map((v) => v.split('/').filter((v) => v.length !== 0));
  url.pathname = pathname[0].join('/');
  existing.api_url = url.toString();

  if (pathname.length === 1) {
    return;
  }

  type Slugs = Pick<NodeOptions, 'team' | 'suite' | 'version'>;
  const slugs: Slugs = {
    team: pathname[1][0],
    suite: pathname[1][1],
    version: pathname[1][2]
  };
  for (const slug in slugs) {
    const key = slug as keyof Slugs;
    if (!slugs[key]) {
      continue;
    }
    if (existing[key] !== undefined && existing[key] !== slugs[key]) {
      throw new Error(`option "${key}" is in conflict with provided api_url`);
    }
    existing[key] = slugs[key];
  }
}

/**
 *
 */
function _validate_options(existing: NodeOptions): void {
  const expected_keys: (keyof NodeOptions)[] = ['team', 'suite', 'version'];
  const has_handshake = existing.offline !== true;
  if (has_handshake && ['api_key', 'api_url'].some((k) => k in existing)) {
    expected_keys.push('api_key', 'api_url');
  }
  const key_status: [keyof NodeOptions, boolean][] = expected_keys.map((k) => [
    k,
    k in existing
  ]);
  const values = key_status.map((v) => v[1]);
  if (values.some(Boolean) && !values.every(Boolean)) {
    const keys = key_status.filter((v) => v[1] === false).map((v) => v[0]);
    throw new Error(
      `missing required option(s) ${keys.map((k) => `"${k}"`).join(', ')}`
    );
  }
}

/**
 *
 */
export function update_options(
  existing: NodeOptions,
  incoming: NodeOptions
): void {
  _apply_config_file(incoming);
  _apply_arguments(existing, incoming);
  _apply_environment_variables(existing);
  _reformat_parameters(existing);
  _validate_options(existing);
}
