// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import ini from 'ini';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Transport } from './transport.js';
import { VERSION } from './version.js';

type TestcaseGenerator = () => Array<string> | Promise<Array<string>>;
type WorkflowCallback = (testcase: string) => void | Promise<void>;

type Workflow = {
  suite?: string;
  version?: string;
  callback?: WorkflowCallback;
  testcases?: Array<string> | TestcaseGenerator;
};

export type NodeOptions = Partial<{
  /**
   * API Key issued by the Touca server that identifies who is submitting
   * the data. Since the value should be treated as a secret, we recommend
   * that you pass it as an environment variable `TOUCA_API_KEY` instead.
   */
  api_key: string;

  /**
   * URL to the Touca server API. Can be provided either in long format
   * like `https://api.touca.io/@/myteam/mysuite/version` or in short
   * format like `https://api.touca.io`. If the team, suite, or version
   * are specified, you do not need to specify them separately.
   */
  api_url: string;

  /**
   * determines whether the scope of test case declaration is bound to
   * the thread performing the declaration, or covers all other threads.
   * Defaults to `True`.
   *
   * If set to `True`, when a thread calls {@link declare_testcase}, all
   * other threads also have their most recent test case changed to the
   * newly declared test case and any subsequent call to data capturing
   * functions such as {@link check} will affect the newly declared
   * test case.
   */
  concurrency: boolean;

  /**
   * determines whether client should connect with the Touca server during
   * the configuration. Defaults to `false` when `api_url` or `api_key` are
   * provided.
   */
  offline: boolean;

  /** slug of the suite on the Touca server */
  suite: string;

  /** slug of your team on the Touca server. */
  team: string;

  /** version of your workflow under test. */
  version: string;
}>;

export type RunnerOptions = NodeOptions &
  Partial<{
    colored_output: boolean;
    config_file: string;
    output_directory: string;
    overwrite_results: boolean;
    save_json: boolean;
    save_binary: boolean;
    testcases: Array<string>;
    workflow_filter: string;
    workflows: Array<Workflow>;
  }>;

export function assignOptions(
  target: Record<string, unknown>,
  source: Record<string, unknown>
) {
  const targetKeys: Record<string, string> = {
    api_key: 'api_key',
    api_url: 'api_url',
    offline: 'offline',
    suite: 'suite',
    team: 'team',
    version: 'version',
    save_binary: 'save_binary',
    save_json: 'save_json',
    output_directory: 'output_directory',
    overwrite_results: 'overwrite_results',
    testcases: 'testcases',
    workflow_filter: 'workflow_filter',
    colored_output: 'colored_output',
    config_file: 'config_file',
    ['api-key']: 'api_key',
    ['api-url']: 'api_url',
    ['revision']: 'version',
    ['save-as-binary']: 'save_binary',
    ['save-as-json']: 'save_json',
    ['output-directory']: 'output_directory',
    ['overwrite']: 'overwrite_results',
    ['filter']: 'workflow_filter',
    ['colored-output']: 'colored_output',
    ['config-file']: 'config_file'
  };
  Object.entries(source)
    .filter(([k, v]) => v !== undefined && k in targetKeys)
    .forEach(([k, v]) => (target[targetKeys[k]] = v));
}

export function findHomeDirectory() {
  const cwd = path.join(process.cwd(), '.touca');
  return fs.existsSync(cwd) ? cwd : path.join(os.homedir(), '.touca');
}

function throwIfMissing(options: NodeOptions, keys: Array<keyof NodeOptions>) {
  for (const key of keys) {
    if (options[key] === undefined) {
      throw new Error(`missing required option(s) "${key}"`);
    }
  }
}

function validateOptionsType<T extends NodeOptions | RunnerOptions>(
  options: T,
  type: 'boolean' | 'string',
  keys: Array<keyof T>
) {
  for (const key of keys) {
    if (key in options && typeof options[key] !== type) {
      throw new Error(`parameter "${String(key)}" has unexpected type`);
    }
  }
}

async function applyCliArguments(options: RunnerOptions): Promise<void> {
  const y = yargs(hideBin(process.argv));
  const argv = await y
    .help('help')
    .version(VERSION)
    .showHelpOnFail(false, 'Specify --help for available options')
    .epilog('Visit https://touca.io/docs for more information.')
    .wrap(y.terminalWidth())
    .options({
      'api-key': {
        type: 'string',
        desc: 'API Key issued by the Touca Server',
        group: 'Common Options'
      },
      'api-url': {
        type: 'string',
        desc: 'API URL issued by the Touca Server',
        group: 'Common Options'
      },
      offline: {
        type: 'boolean',
        desc: 'Disables all communications with the Touca server',
        boolean: true,
        default: false,
        group: 'Common Options'
      },
      suite: {
        type: 'string',
        desc: 'Slug of suite to which test results belong',
        group: 'Common Options'
      },
      team: {
        type: 'string',
        desc: 'Slug of team to which test results belong',
        group: 'Common Options'
      },
      revision: {
        type: 'string',
        desc: 'Version of the code under test',
        group: 'Common Options'
      },
      'save-as-binary': {
        type: 'boolean',
        desc: 'Save a copy of test results on local filesystem in binary format',
        boolean: true,
        default: false,
        group: 'Runner Options'
      },
      'save-as-json': {
        type: 'boolean',
        desc: 'Save a copy of test results on local filesystem in JSON format',
        boolean: true,
        default: false,
        group: 'Runner Options'
      },
      'output-directory': {
        type: 'string',
        desc: 'Path to a local directory to store result files',
        group: 'Runner Options'
      },
      overwrite: {
        type: 'boolean',
        desc: 'Overwrite result directory for testcase if it already exists',
        group: 'Runner Options',
        boolean: true,
        default: false
      },
      testcases: {
        type: 'array',
        desc: 'One or more testcases to feed to the workflow',
        group: 'Runner Options'
      },
      filter: {
        type: 'string',
        desc: 'Name of the workflow to run',
        group: 'Runner Options'
      },
      'log-level': {
        type: 'string',
        desc: 'Level of detail with which events are logged',
        choices: ['debug', 'info', 'warn'],
        default: 'info',
        hidden: true,
        group: 'Runner Options'
      },
      'colored-output': {
        type: 'boolean',
        desc: 'Use color in standard output',
        boolean: true,
        default: true,
        group: 'Runner Options'
      },
      'config-file': {
        type: 'string',
        desc: 'Path to a configuration file',
        group: 'Other Options'
      }
    }).argv;
  const config = argv;
  config.offline = [undefined, true].includes(argv['offline']);
  config.testcases = (argv['testcases'] || []).map(String);
  const initial: RunnerOptions = {};
  assignOptions(initial, config);
  options = { ...initial, ...options };
}

function applyConfigFile(options: RunnerOptions) {
  const file = options.config_file;
  if (!file) {
    return;
  }
  if (!fs.statSync(file, { throwIfNoEntry: false })?.isFile()) {
    throw new Error('config file not found');
  }
  const content = fs.readFileSync(file, 'utf-8');
  const parsed = JSON.parse(content)['touca'];
  if (!parsed) {
    throw new Error('config file empty');
  }
  assignOptions(options, parsed);
}

function applyConfigProfile(options: RunnerOptions) {
  let name = 'default';
  const home = findHomeDirectory();
  const settings = path.join(home, 'settings');
  if (fs.existsSync(settings)) {
    const config = ini.parse(fs.readFileSync(settings, 'utf-8'));
    name = config.settings?.profile ?? name;
  }
  const profile = path.join(home, 'profiles', name);
  if (fs.existsSync(profile)) {
    const config = ini.parse(fs.readFileSync(profile, 'utf-8'));
    assignOptions(options, config.settings);
  }
}

function applyEnvironmentVariables(options: NodeOptions): void {
  assignOptions(options, {
    api_key: process.env['TOUCA_API_KEY'],
    api_url: process.env['TOUCA_API_URL'],
    version: process.env['TOUCA_TEST_VERSION']
  });
}

function applyApiUrl(options: NodeOptions): void {
  if (!options.api_url) {
    return;
  }
  const api_url = options.api_url;
  const has_protocol = ['http', 'https'].some((v) => api_url.startsWith(v));
  const url = new URL(has_protocol ? api_url : 'https://' + api_url);
  const pathname = url.pathname
    .split('/@/')
    .map((v) => v.split('/').filter((v) => v.length !== 0));
  url.pathname = pathname[0].join('/');
  options.api_url = url.toString();
  if (pathname.length > 1) {
    const slugs = pathname[1];
    const keys: Array<keyof Pick<RunnerOptions, 'team' | 'suite' | 'version'>> =
      ['team', 'suite', 'version'];
    slugs.forEach((slug, i) => (options[keys[i]] = slug));
  }
}

function applyNodeOptions(options: NodeOptions): void {
  if (!options.concurrency) {
    options.concurrency = true;
  }
  if (!options.offline) {
    options.offline = !options.api_key && !options.api_url;
  }
}

async function applyRunnerOptions(options: RunnerOptions): Promise<void> {
  //
  if (!options.output_directory) {
    options.output_directory = path.join(findHomeDirectory(), 'results');
  }
  //
  if (!options.workflows) {
    options.workflows = [];
  }
  //
  if (options.workflow_filter) {
    options.workflows = options.workflows.filter(
      (v) => v.suite === options.workflow_filter
    );
    delete options.workflow_filter;
  }
  //
  for (const v of options.workflows) {
    if (options.testcases?.length) {
      v.testcases = options.testcases;
    } else if (v.testcases && !Array.isArray(v.testcases)) {
      v.testcases = await v.testcases();
    }
    if (options.suite) {
      v.suite = options.suite;
    }
    if (options.version) {
      v.version = options.version;
    }
  }
  delete options.suite;
  delete options.version;
  delete options.testcases;
}

type RemoteOptionsInput = {
  team: string;
  suite: string;
  version?: string;
  testcases?: string[];
};

async function fetchRemoteOptions(
  input: Array<Partial<RemoteOptionsInput>>,
  transport: Transport
): Promise<Array<RemoteOptionsInput>> {
  const response = await transport.request(
    'POST',
    '/client/options',
    JSON.stringify(input)
  );
  if (response.status !== 200) {
    throw new Error('client options');
  }
  return JSON.parse(response.body);
}

async function applyRemoteOptions(
  options: RunnerOptions,
  transport: Transport
): Promise<void> {
  if (!options.workflows) {
    return;
  }
  const res = await fetchRemoteOptions(
    options.workflows.map((v) => ({
      team: options.team,
      suite: v.suite,
      version: v.version,
      testcases: v.testcases as string[] | undefined
    })),
    transport
  );
  for (const v of res) {
    const w = options.workflows.find((w) => w.suite === v.suite);
    if (w && v?.version) {
      w.version = v.version;
    }
    if (w && v?.testcases) {
      w.testcases = v?.testcases;
    }
  }
}

function validateNodeOptions(options: NodeOptions) {
  validateOptionsType(options, 'boolean', ['concurrency', 'offline']);
  validateOptionsType(options, 'string', [
    'api_key',
    'api_url',
    'suite',
    'team',
    'version'
  ]);
  const slugs = [options.team, options.suite, options.version];
  if (slugs.some(Boolean)) {
    throwIfMissing(options, ['team', 'suite', 'version']);
  }
  if (!options.offline) {
    throwIfMissing(options, ['api_key', 'api_url']);
  }
  return slugs.some(Boolean) && !slugs.every(Boolean)
    ? false
    : options.offline
    ? true
    : [options.api_key, options.api_url].every(Boolean);
}

function validateRunnerOptions(options: RunnerOptions) {
  validateOptionsType(options, 'boolean', [
    'colored_output',
    'concurrency',
    'offline',
    'overwrite_results',
    'save_binary',
    'save_json'
  ]);
  validateOptionsType(options, 'string', [
    'api_key',
    'api_url',
    'config_file',
    'output_directory',
    'suite',
    'team',
    'version',
    'workflow_filter'
  ]);
  if (!options.offline) {
    throwIfMissing(options, ['api_key', 'api_url']);
  }
  if (!options.workflows?.every((v) => v.version)) {
    throw new Error('required option "version" is missing');
  }
  if (!options.workflows?.every((v) => v.testcases?.length)) {
    throw new Error('required option "testcases" is missing');
  }
}

export async function updateNodeOptions(
  options: NodeOptions,
  transport = new Transport()
): Promise<boolean> {
  applyEnvironmentVariables(options);
  applyApiUrl(options);
  applyNodeOptions(options);
  if (!options.offline && options.api_key && options.api_url) {
    await transport.authenticate(options.api_url, options.api_key);
  }
  return validateNodeOptions(options);
}

export async function updateRunnerOptions(
  options: RunnerOptions,
  transport = new Transport()
): Promise<void> {
  await applyCliArguments(options);
  applyConfigFile(options);
  applyConfigProfile(options);
  applyEnvironmentVariables(options);
  applyApiUrl(options);
  applyNodeOptions(options);
  if (!options.offline && options.api_key && options.api_url) {
    await transport.authenticate(options.api_url, options.api_key);
  }
  await applyRunnerOptions(options);
  if (!options.offline && options.api_key && options.api_url) {
    await applyRemoteOptions(options, transport);
  }
  validateRunnerOptions(options);
}
