// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

/**
 * @file runner
 *
 * Touca Test Framework for JavaScript is designed to make writing regression
 * test workflows easy and straightforward. The test framework abstracts away
 * many of the common expected features such as logging, error handling and
 * progress reporting.
 *
 * The following example demonstrates how to use this framework:
 *
 * ```js
 *  import { touca } from '@touca/node';
 *  import { find_student, calculate_gpa } from  './code_under_test';
 *
 *  touca.workflow('test_students', (testcase: string) => {
 *    const student = find_student(testcase);
 *    touca.assume('username', student.username);
 *    touca.check('fullname', student.fullname);
 *    touca.check('birth_date', student.dob);
 *    touca.check('gpa', calculate_gpa(student.courses));
 *  });
 *
 *  touca.run();
 * ```
 * It is uncommon to run multiple regression test workflows as part of a
 * single suite. However, the pattern above allows introducing multiple
 * workflows using the {@link touca.workflow} function.
 */

import * as chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { gte } from 'semver';
import * as util from 'util';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { NodeClient } from './client';
import { find_home_path, NodeOptions, update_options } from './options';
import { VERSION } from './version';

export type Workflow = {
  callback: (testcase: string) => void | Promise<void>;
} & Partial<{
  testcases: Array<string> | (() => Promise<Array<string>>);
}>;

interface RunnerOptions extends NodeOptions {
  overwrite: boolean;
  save_json: boolean;
  save_binary: boolean;
  testcases: string[];
  testcase_file: string;
  output_directory: string;
  colored_output: boolean;
  workflow?: string;
  // log_level: 'debug' | 'info' | 'warn';
}

enum ToucaErrorCode {
  MissingWorkflow = 1,
  InvalidWorkflow,
  MissingSlugs,
  NoCaseMissingFile,
  NoCaseMissingRemote,
  NoCaseEmptyRemote
}

class ToucaError extends Error {
  static errors = new Map<ToucaErrorCode, string>([
    [
      ToucaErrorCode.MissingWorkflow,
      `
      No workflow is registered.
      `
    ],
    [
      ToucaErrorCode.InvalidWorkflow,
      `
      Workflow '%s' does not exist.
      `
    ],
    [
      ToucaErrorCode.MissingSlugs,
      `
      Options %s are required when using this test framework.
      `
    ],
    [
      ToucaErrorCode.NoCaseMissingFile,
      `
      Specified testcase file "%s" does not exist.
      `
    ],
    [
      ToucaErrorCode.NoCaseMissingRemote,
      `
      Cannot proceed without a test case.
      Either use '--testcase' or '--testcase-file' to pass test cases
      or use '--api-key' and '--api-url' to let the library query
      the Touca Server to obtain and reuse the list of test cases
      submitted to the baseline version of this suite.
      `
    ],
    [
      ToucaErrorCode.NoCaseEmptyRemote,
      `
      Cannot proceed without a test case.
      Neither '--testcase' nor '--testcase-file' were provided.
      Attempted to query the Touca Server to obtain and reuse the
      list of test cases submitted to the baseline version of this
      suite but this suite has no previous version.
      `
    ]
  ]);

  constructor(code: ToucaErrorCode, args: string[] = []) {
    super(
      ToucaError.errors.has(code)
        ? util.format(ToucaError.errors.get(code), ...args)
        : 'Unknown Error'
    );
  }
}

enum Status {
  Sent = 'Sent',
  Skip = 'Skip',
  Fail = 'Fail'
}

class Statistics {
  private _values: Record<string, number> = {};

  public inc(name: Status): void {
    if (!(name in this._values)) {
      this._values[name] = 0;
    }
    this._values[name] += 1;
  }

  public count(name: Status) {
    return this._values[name] ?? 0;
  }
}

class Timer {
  private _tics: Record<string, number> = {};
  private _times: Record<string, number> = {};

  public tic(name: string): void {
    this._tics[name] = new Date().getTime();
  }

  public toc(name: string): void {
    this._times[name] = new Date().getTime() - this._tics[name];
  }

  public count(name: string) {
    return this._times[name];
  }
}

class Printer {
  private _testcase_width: number;
  private _testcase_count: number;
  private _colored_output: boolean;

  static printError(fmt: string, ...args: unknown[]) {
    process.stderr.write(util.format(fmt, ...args));
  }
  static printAppHeader() {
    process.stdout.write('\nTouca Test Framework\n');
  }
  static printAppFooter() {
    process.stdout.write('\n✨   Ran all test suites.\n\n');
  }

  constructor(options: RunnerOptions) {
    this._testcase_width = options.testcases.reduce(
      (sum: number, testcase: string) => Math.max(testcase.length, sum),
      0
    );
    this._testcase_count = options.testcases.length;
    this._colored_output = options.colored_output;
  }

  private print(fmt: string, ...args: unknown[]) {
    process.stdout.write(util.format(fmt, ...args));
  }

  private print_color(color: chalk.Chalk, fmt: string, ...args: unknown[]) {
    const msg = util.format(fmt, ...args);
    process.stdout.write(this._colored_output ? color(msg) : msg);
  }

  public print_header(suite: string, version: string) {
    this.print('\nSuite: %s/%s\n\n', suite, version);
  }

  public print_progress(
    index: number,
    status: Status,
    testcase: string,
    timer: Timer,
    errors: string[] = []
  ) {
    const badge = {
      [Status.Sent]: { color: chalk.bgGreen, text: ' SENT ' },
      [Status.Skip]: { color: chalk.bgYellow, text: ' SKIP ' },
      [Status.Fail]: { color: chalk.bgRed, text: ' FAIL ' }
    }[status];
    const pad = Math.floor(Math.log10(this._testcase_count)) + 1;
    this.print(' %s', String(index + 1).padStart(pad));
    this.print_color(chalk.blackBright, '. ');
    this.print_color(badge.color, badge.text);
    this.print(' %s', testcase.padEnd(this._testcase_width));
    if (status !== Status.Skip) {
      this.print_color(chalk.blackBright, '   (%d ms)', timer.count(testcase));
    }
    this.print('\n');
    if (errors.length) {
      const list = errors.map((v) => util.format('      - %s', v)).join('\n');
      this.print_color(chalk.blackBright, '\n   Exception Raised:');
      this.print('\n%s\n\n', list);
    }
  }

  public print_footer(stats: Statistics, suiteSize: number, timer: Timer) {
    const duration = (timer.count('__workflow__') / 1000.0).toFixed(2);
    const report = (status: Status, text: string, color: chalk.Chalk) => {
      if (stats.count(status)) {
        this.print_color(color, '%d %s', stats.count(status), text);
        this.print(', ');
      }
    };

    this.print('\nTests:     ');
    report(Status.Sent, 'submitted', chalk.green);
    report(Status.Skip, 'skipped', chalk.yellow);
    report(Status.Fail, 'failed', chalk.red);
    this.print('%d total\n', suiteSize);
    this.print('Time:      %f s\n', duration);
  }
}

async function _parse_cli_options(args: string[]): Promise<RunnerOptions> {
  const y = yargs(hideBin(args));
  const argv = await y
    .help('help')
    .version(VERSION)
    .showHelpOnFail(false, 'Specify --help for available options')
    .epilog('Visit https://touca.io/docs for more information.')
    .wrap(y.terminalWidth())
    .options({
      'api-key': {
        type: 'string',
        desc: 'API Key issued by the Touca Server'
      },
      'api-url': {
        type: 'string',
        desc: 'API URL issued by the Touca Server'
      },
      revision: {
        type: 'string',
        desc: 'Version of the code under test'
      },
      suite: {
        type: 'string',
        desc: 'Slug of suite to which test results belong'
      },
      team: {
        type: 'string',
        desc: 'Slug of team to which test results belong'
      },
      workflow: {
        type: 'string',
        desc: 'Name of the workflow to run'
      },
      'config-file': {
        type: 'string',
        desc: 'Path to a configuration file'
      },
      testcase: {
        type: 'array',
        desc: 'One or more testcases to feed to the workflow',
        conflicts: 'testcase-file'
      },
      'testcase-file': {
        type: 'string',
        desc: 'Single file listing testcases to feed to the workflows',
        conflicts: 'testcase'
      },
      'save-as-binary': {
        type: 'boolean',
        desc: 'Save a copy of test results on local filesystem in binary format',
        boolean: true,
        default: false
      },
      'save-as-json': {
        type: 'boolean',
        desc: 'Save a copy of test results on local filesystem in JSON format',
        boolean: true,
        default: false
      },
      overwrite: {
        type: 'boolean',
        desc: 'Overwrite result directory for testcase if it already exists',
        boolean: true,
        default: false
      },
      'output-directory': {
        type: 'string',
        desc: 'Path to a local directory to store result files',
        default: path.join(find_home_path(), 'results')
      },
      // 'log-level': {
      //   type: 'string',
      //   desc: 'Level of detail with which events are logged',
      //   choices: ['debug', 'info', 'warn'],
      //   default: 'info'
      // },
      offline: {
        type: 'boolean',
        desc: 'Disables all communications with the Touca server',
        boolean: true,
        default: false
      },
      'colored-output': {
        type: 'boolean',
        desc: 'Use color in standard output',
        boolean: true,
        default: true
      }
    }).argv;
  return {
    api_key: argv['api-key'],
    api_url: argv['api-url'],
    version: argv['revision'],
    team: argv['team'],
    suite: argv['suite'],
    workflow: argv['workflow'],
    file: argv['config-file'],
    offline: [undefined, true].includes(argv['offline']),
    save_json: argv['save-as-json'],
    save_binary: argv['save-as-binary'],
    output_directory: argv['output-directory'],
    // log_level: argv['log-level'] as 'debug' | 'info' | 'warn',
    overwrite: argv['overwrite'],
    testcases: (argv['testcase'] || []).map(String),
    testcase_file: argv['testcase-file'] as string,
    colored_output: argv['colored-output']
  };
}

export class Runner {
  private _workflows: Record<string, Workflow> = {};

  constructor(private readonly _client: NodeClient) {}

  public async add_workflow(name: string, workflow: Workflow): Promise<void> {
    this._workflows[name] = workflow;
  }

  public async run(): Promise<void> {
    if (Object.keys(this._workflows).length === 0) {
      throw new ToucaError(ToucaErrorCode.MissingWorkflow);
    }
    try {
      const options = await _parse_cli_options(process.argv);
      const workflows = this.filterWorkflows(options.workflow);
      const status = await this._run_workflows(options, workflows);
      process.exit(status ? 0 : 1);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown Error';
      process.stderr.write(util.format('\nTest failed:\n%s\n', error));
      process.exit(1);
    }
  }

  private filterWorkflows(name: string | undefined) {
    if (!name) {
      return this._workflows;
    }
    if (name in this._workflows) {
      return { [name]: this._workflows[name] };
    }
    throw new ToucaError(ToucaErrorCode.InvalidWorkflow, [name]);
  }

  private async findWorkflowOptions(workflow: Workflow) {
    const options: Partial<RunnerOptions> = {};
    if (workflow.testcases) {
      const tc = workflow.testcases;
      options.testcases = Array.isArray(tc) ? tc : await tc();
    }
    return options;
  }

  private async _run_workflows(
    opts: RunnerOptions,
    workflows: Record<string, Workflow>
  ): Promise<boolean> {
    Printer.printAppHeader();
    for (const [suite, workflow] of Object.entries(workflows)) {
      try {
        const workflowOptions = await this.findWorkflowOptions(workflow);
        const options: RunnerOptions = { ...opts, ...workflowOptions, suite };
        await this._initialize(options);
        await this._runWorkflow(options, workflow);
      } catch (error) {
        const prefix = `Error when running suite "${suite}"`;
        const message = (error as ToucaError).message;
        Printer.printError('\n%s:\n%s\n', prefix, message);
        return false;
      }
    }
    Printer.printAppFooter();
    return true;
  }

  private async _initialize(options: RunnerOptions): Promise<void> {
    // Let the lower-level library consolidate the provided config options
    // including applying environment variables and processing long-format
    // api_url.
    update_options(options, options);

    // Check that team, suite and version are provided.
    const missing = (
      ['team', 'suite', 'version'] as (keyof RunnerOptions)[]
    ).filter((v) => options[v] === undefined);
    if (missing.length !== 0) {
      throw new ToucaError(ToucaErrorCode.MissingSlugs, [
        missing.map((v) => `"${v}"`).join(', ')
      ]);
    }

    // Check that testcase file exists
    if (options.testcase_file && !fs.existsSync(options.testcase_file)) {
      throw new ToucaError(ToucaErrorCode.NoCaseMissingFile, [
        options.testcase_file
      ]);
    }

    // Create directory to write logs and test results into
    if (!fs.existsSync(options.output_directory)) {
      fs.mkdirSync(options.output_directory, { recursive: true });
    }

    // Configure the lower-level Touca library
    if (!(await this._client.configure(options))) {
      throw new Error(this._client.configuration_error());
    }

    if (options.version === 'unknown') {
      options.version = await this._client.getNextBatch();
    }

    // Update list of test cases
    await this._update_testcase_list(options);
  }

  /**
   * Use provided config options to find the final list of test cases to use
   * for running the workflows. The following implementation assumes options
   * `--testcases` and `--testcase-file` are mutually exclusive.
   */
  private async _update_testcase_list(options: RunnerOptions): Promise<void> {
    if (options.testcases.length !== 0) {
      return;
    }
    if (options.testcase_file) {
      const content = fs.readFileSync(options.testcase_file, {
        encoding: 'utf-8'
      });
      options.testcases = content
        .split('\n')
        .filter((v) => v.length !== 0 && !v.startsWith('#'));
      return;
    }
    if (
      options.offline ||
      ['api_key', 'api_url'].some((v) => !(v in options))
    ) {
      throw new ToucaError(ToucaErrorCode.NoCaseMissingRemote);
    }
    options.testcases = await this._client.get_testcases();
    if (options.testcases.length === 0) {
      throw new ToucaError(ToucaErrorCode.NoCaseEmptyRemote);
    }
  }

  private async _runWorkflow(options: RunnerOptions, workflow: Workflow) {
    const printer = new Printer(options);
    printer.print_header(options.suite as string, options.version as string);
    const offline = options.offline || !options.api_key || !options.api_url;
    const timer = new Timer();
    const stats = new Statistics();
    timer.tic('__workflow__');

    for (const [index, testcase] of options.testcases.entries()) {
      const testcase_directory = path.join(
        options.output_directory,
        options.suite as string,
        options.version as string,
        testcase
      );

      if (!options.overwrite && this._skip(options, testcase)) {
        printer.print_progress(index, Status.Skip, testcase, timer);
        stats.inc(Status.Skip);
        continue;
      }

      if (fs.existsSync(testcase_directory)) {
        const func = gte(process.version, '15.0.0') ? fs.rmSync : fs.rmdirSync;
        func(testcase_directory, { recursive: true });
        fs.mkdirSync(testcase_directory);
      }

      this._client.declare_testcase(testcase);
      timer.tic(testcase);

      const errors = [];
      try {
        await workflow.callback(testcase);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown Error';
        errors.push(error);
      }

      timer.toc(testcase);
      stats.inc(errors.length ? Status.Fail : Status.Sent);

      if (errors.length === 0 && options.save_binary) {
        const filepath = path.join(testcase_directory, 'touca.bin');
        await this._client.save_binary(filepath, [testcase]);
      }
      if (errors.length === 0 && options.save_json) {
        const filepath = path.join(testcase_directory, 'touca.json');
        await this._client.save_json(filepath, [testcase]);
      }
      if (errors.length === 0 && !offline) {
        await this._client.post();
      }

      const status = errors.length ? Status.Fail : Status.Sent;
      printer.print_progress(index, status, testcase, timer, errors);

      this._client.forget_testcase(testcase);
    }

    timer.toc('__workflow__');
    printer.print_footer(stats, options.testcases.length, timer);

    if (!offline) {
      await this._client.seal();
    }
  }

  private _skip(options: RunnerOptions, testcase: string): boolean {
    const testcase_directory = path.join(
      options.output_directory,
      options.suite as string,
      options.version as string,
      testcase
    );
    return options.save_binary
      ? fs.existsSync(path.join(testcase_directory, 'touca.bin'))
      : options.save_json
      ? fs.existsSync(path.join(testcase_directory, 'touca.json'))
      : false;
  }
}
