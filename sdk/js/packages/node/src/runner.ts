// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';

import chalk, { ChalkInstance } from 'chalk';
import { gte } from 'semver';

import { NodeClient } from './client.js';
import { RunnerOptions, updateRunnerOptions } from './options.js';
import { Transport } from './transport.js';

type Status = 'Sent' | 'Skip' | 'Fail';
type WorkflowOptions = Required<
  Omit<RunnerOptions, 'config_file' | 'workflows' | 'workflow_filter'>
> &
  Required<Pick<Exclude<RunnerOptions['workflows'], undefined>[0], 'callback'>>;

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
  private v: Record<string, { tic: number; duration?: number }> = {};
  tic(name: string) {
    this.v[name] = { tic: new Date().getTime() };
  }
  toc(name: string) {
    this.v[name].duration = new Date().getTime() - this.v[name].tic;
  }
  count(name: string) {
    return this.v[name].duration || 0;
  }
}

class Printer {
  static printError(fmt: string, ...args: unknown[]) {
    process.stderr.write(util.format(fmt, ...args));
  }
  static printAppHeader() {
    process.stdout.write('\nTouca Test Framework\n');
  }
  static printAppFooter() {
    process.stdout.write('\n✨   Ran all test suites.\n\n');
  }

  constructor(
    private colored_output: boolean,
    private testcase_width: number,
    private testcase_count: number
  ) {}

  private print(fmt: string, ...args: unknown[]) {
    process.stdout.write(util.format(fmt, ...args));
  }

  private print_color(color: ChalkInstance, fmt: string, ...args: unknown[]) {
    const msg = util.format(fmt, ...args);
    process.stdout.write(this.colored_output ? color(msg) : msg);
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
    const badge: { color: ChalkInstance; text: string } = {
      Sent: { color: chalk.bgGreen, text: ' SENT ' },
      Skip: { color: chalk.bgYellow, text: ' SKIP ' },
      Fail: { color: chalk.bgRed, text: ' FAIL ' }
    }[status];
    const pad = Math.floor(Math.log10(this.testcase_count)) + 1;
    this.print(' %s', String(index + 1).padStart(pad));
    this.print_color(chalk.blackBright, '. ');
    this.print_color(badge.color, badge.text);
    this.print(' %s', testcase.padEnd(this.testcase_width));
    if (status !== 'Skip') {
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
    const report = (status: Status, text: string, color: ChalkInstance) => {
      if (stats.count(status)) {
        this.print_color(color, '%d %s', stats.count(status), text);
        this.print(', ');
      }
    };

    this.print('\nTests:     ');
    report('Sent', 'submitted', chalk.green);
    report('Skip', 'skipped', chalk.yellow);
    report('Fail', 'failed', chalk.red);
    this.print('%d total\n', suiteSize);
    this.print('Time:      %f s\n', duration);
  }
}

function getWorkflowOptions(options: RunnerOptions) {
  if (!options.workflows) {
    return [];
  }
  return options.workflows.map((w) => {
    const { config_file, workflows, workflow_filter, ...rest } = options;
    return { ...rest, ...w } as WorkflowOptions;
  });
}

async function runWorkflow(client: NodeClient, options: WorkflowOptions) {
  await client.configure(options);
  const printer = new Printer(
    options.colored_output,
    options.testcases.reduce((sum, tc) => Math.max(tc.length, sum), 0),
    options.testcases.length
  );
  printer.print_header(options.suite, options.version);
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
    const skip = options.save_binary
      ? fs.existsSync(path.join(testcase_directory, 'touca.bin'))
      : options.save_json
      ? fs.existsSync(path.join(testcase_directory, 'touca.json'))
      : false;
    if (!options.overwrite_results && skip) {
      printer.print_progress(index, 'Skip', testcase, timer);
      stats.inc('Skip');
      continue;
    }
    if (fs.existsSync(testcase_directory)) {
      const func = gte(process.version, '15.0.0') ? fs.rmSync : fs.rmdirSync;
      func(testcase_directory, { recursive: true });
      fs.mkdirSync(testcase_directory);
    }

    client.declare_testcase(testcase);
    timer.tic(testcase);

    const errors: string[] = [];
    try {
      await options.callback(testcase);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown Error';
      errors.push(error);
    }

    timer.toc(testcase);
    stats.inc(errors.length ? 'Fail' : 'Sent');

    if (errors.length === 0 && options.save_binary) {
      const filepath = path.join(testcase_directory, 'touca.bin');
      await client.save_binary(filepath, [testcase]);
    }
    if (errors.length === 0 && options.save_json) {
      const filepath = path.join(testcase_directory, 'touca.json');
      await client.save_json(filepath, [testcase]);
    }
    if (errors.length === 0 && !options.offline) {
      await client.post();
    }
    client.forget_testcase(testcase);

    const status = errors.length ? 'Fail' : 'Sent';
    printer.print_progress(index, status, testcase, timer, errors);
  }

  timer.toc('__workflow__');
  printer.print_footer(stats, options.testcases.length, timer);
  if (!options.offline) {
    await client.seal();
  }
}

export async function run(
  options: RunnerOptions,
  transport: Transport,
  client: NodeClient
): Promise<void> {
  await updateRunnerOptions(options, transport);
  if (
    (options.save_binary || options.save_json) &&
    options.output_directory &&
    !fs.existsSync(options.output_directory)
  ) {
    fs.mkdirSync(options.output_directory, { recursive: true });
  }
  Printer.printAppHeader();
  for (const workflowOptions of getWorkflowOptions(options)) {
    try {
      await runWorkflow(client, workflowOptions);
    } catch (error) {
      const prefix = `Error when running suite "${workflowOptions.suite}"`;
      const message = (error as Error).message;
      Printer.printError('\n%s:\n%s\n', prefix, message);
    }
  }
  Printer.printAppFooter();
}
