// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { Builder } from 'flatbuffers';

import { Case, CheckOptions } from './case.js';
import { NodeOptions, update_options } from './options.js';
import { Runner, Workflow } from './runner.js';
import * as schema from './schema.js';
import { Transport } from './transport.js';
import { TypeHandler } from './types.js';

interface BaseClient<Options> {
  configure(options: Options): Promise<boolean>;
  is_configured(): boolean;
  configuration_error(): string;
  get_testcases(): PromiseLike<string[]>;
  declare_testcase(slug: string): void;
  forget_testcase(slug: string): void;
  check(key: string, value: unknown): void;
  assume(key: string, value: unknown): void;
  add_array_element(key: string, value: unknown): void;
  add_hit_count(key: string): void;
  add_metric(key: string, milliseconds: number): void;
  start_timer(key: string): void;
  stop_timer(key: string): void;
  post(): PromiseLike<void>;
  seal(): PromiseLike<void>;
}

export class NodeClient implements BaseClient<NodeOptions> {
  private _cases = new Map<string, Case>();
  private _configured = false;
  private _configuration_error = '';
  private _options: NodeOptions = {};
  private _active_case: string | null = null;
  private _transport?: Transport;
  private _type_handler = new TypeHandler();
  private _runner = new Runner(this);

  private _make_transport(): boolean {
    const keys: (keyof NodeOptions)[] = ['api_key', 'api_url', 'team', 'suite'];
    if (this._options.offline === true) {
      return false;
    }
    if (!keys.every((key) => key in this._options)) {
      return false;
    }
    if (!this._transport) {
      this._transport = new Transport(this._options);
      return true;
    }
    const diff = keys.filter(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (k) => this._transport!.options[k] !== this._options[k]
    );
    if (diff.length !== 0) {
      this._transport.update_options(this._options);
    }
    return true;
  }

  private _serialize(cases: Case[]): Uint8Array {
    const builder = new Builder(1024);
    const msg_buf = [];
    for (const item of cases.reverse()) {
      const content = item.serialize();
      const buf = schema.MessageBuffer.createBufVector(builder, content);
      schema.MessageBuffer.startMessageBuffer(builder);
      schema.MessageBuffer.addBuf(builder, buf);
      msg_buf.push(schema.MessageBuffer.endMessageBuffer(builder));
    }
    const fbs_msg_buf = schema.Messages.createMessagesVector(builder, msg_buf);
    schema.Messages.startMessages(builder);
    schema.Messages.addMessages(builder, fbs_msg_buf);
    const fbs_messages = schema.Messages.endMessages(builder);
    builder.finish(fbs_messages);
    return builder.asUint8Array();
  }

  private _prepare_save(path: string, cases: string[]): Case[] {
    if (dirname(path).length !== 0) {
      mkdirSync(dirname(path), { recursive: true });
    }
    if (cases.length !== 0) {
      return Array.from(this._cases.entries())
        .filter((k) => cases.includes(k[0]))
        .map((k) => k[1]);
    }
    return Array.from(this._cases.values());
  }

  /**
   * Configures the Touca client. Must be called before declaring test cases
   * and adding results to the client. Should be regarded as a potentially
   * expensive operation. Should be called only from your test environment.
   *
   * {@link configure} takes a variety of configuration parameters
   * documented below. All of these parameters are optional. Calling this
   * function without any parameters is possible: the client can capture
   * behavior and performance data and store them on a local filesystem
   * but it will not be able to post them to the Touca server.
   *
   * In most cases, You will need to pass API Key and API URL during the
   * configuration. The code below shows the common pattern in which API URL
   * is given in long format (it includes the team slug and the suite slug)
   * and API Key as well as the version of the code under test are specified
   * as environment variables `TOUCA_API_KEY` and `TOUCA_TEST_VERSION`,
   * respectively:
   *
   * ```js
   * touca.configure({api_url: 'https://api.touca.io/@/acme/students'})
   * ```
   *
   * As long as the API Key and API URL to the Touca server are known to
   * the client, it attempts to perform a handshake with the Touca Server to
   * authenticate with the server and obtain the list of known test cases
   * for the baseline version of the specified suite. You can explicitly
   * disable this handshake in rare cases where you want to prevent ever
   * communicating with the Touca server.
   *
   * You can call {@link configure} any number of times. The client
   * preserves the configuration parameters specified in previous calls to
   * this function.
   *
   * @return `True` if client is ready to capture data.
   */
  public async configure(options: NodeOptions = {}): Promise<boolean> {
    this._configuration_error = '';
    try {
      update_options(this._options, options);
      if (this._make_transport()) {
        await this._transport?.authenticate();
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown Error';
      this._configuration_error = `Configuration failed: ${error}`;
      return false;
    }
    this._configured = true;
    return true;
  }

  /**
   * Checks if previous call(s) to {@link configure} have set the right
   * combination of configuration parameters to enable the client to perform
   * expected tasks.
   *
   * We recommend that you perform this check after client configuration and
   * before calling other functions of the library:
   *
   * ```js
   * if (!touca.is_configured()) {
   *   console.log(touca.configuration_error());
   * }
   * ```
   *
   * At a minimum, the client is considered configured if it can capture
   * test results and store them locally on the filesystem. A single call
   * to {@link configure} without any configuration parameters can help
   * us get to this state. However, if a subsequent call to {@link configure}
   * sets the parameter `api_url` in short form without specifying
   * parameters such as `team`, `suite` and `version`, the client
   * configuration is incomplete: We infer that the user intends to submit
   * results but the provided configuration parameters are not sufficient
   * to perform this operation.
   *
   * @return `True` if the client is properly configured
   * @see {@link configure}
   */
  public is_configured(): boolean {
    return this._configured;
  }

  /**
   * Provides the most recent error, if any, that is encountered during client
   * configuration.
   *
   * @returns short description of the most recent configuration error
   */
  public configuration_error(): string {
    return this._configuration_error;
  }

  /**
   * Queries the Touca server for the list of testcases that are submitted
   * to the baseline version of this suite.
   *
   * @throws when called on the client that is not configured to communicate
   *         with the Touca server.
   *
   * @returns list of test cases of the baseline version of this suite
   */
  public async get_testcases(): Promise<string[]> {
    if (!this._transport) {
      throw new Error('client not configured to perform this operation');
    }
    return this._transport.get_testcases();
  }

  /**
   * Queries the Touca server for the next version increment of this suite.
   *
   * @throws when called on the client that is not configured to communicate
   *         with the Touca server.
   *
   * @returns next version increment of this suite
   */
  public async getNextBatch(): Promise<string> {
    if (!this._transport) {
      throw new Error('client not configured to perform this operation');
    }
    const version = await this._transport.getNextBatch();
    this._transport.update_options({ version });
    this._options.version = version;
    return version;
  }

  /**
   * Declares name of the test case to which all subsequent results will be
   * submitted until a new test case is declared.
   *
   * If configuration parameter `concurrency` is set to `"enabled"`, when
   * a thread calls `declare_testcase` all other threads also have their most
   * recent testcase changed to the newly declared one. Otherwise, each
   * thread will submit to its own testcase.
   *
   * @param name name of the testcase to be declared
   */
  public declare_testcase(name: string): void {
    if (!this._configured) {
      return;
    }
    if (!this._cases.has(name)) {
      const testcase = new Case({
        name,
        team: this._options.team,
        suite: this._options.suite,
        version: this._options.version
      });
      this._cases.set(name, testcase);
    }
    this._active_case = name;
  }

  /**
   * Removes all logged information associated with a given test case.
   *
   * This information is removed from memory, such that switching back to
   * an already-declared or already-submitted test case would behave similar
   * to when that test case was first declared. This information is removed,
   * for all threads, regardless of the configuration option `concurrency`.
   * Information already submitted to the server will not be removed from
   * the server.
   *
   * This operation is useful in long-running regression test frameworks,
   * after submission of test case to the server, if memory consumed by
   * the client library is a concern or if there is a risk that a future
   * test case with a similar name may be executed.
   *
   * @param name name of the testcase to be removed from memory
   *
   * @throws when called with the name of a test case that was never declared
   */
  public forget_testcase(name: string): void {
    if (!this._cases.has(name)) {
      throw new Error(`test case "${name}" was never declared`);
    }
    this._cases.delete(name);
  }

  /**
   * Captures the value of a given variable as a data point for the declared
   * test case and associates it with the specified key.
   *
   * @param key name to be associated with the captured data point
   * @param value value to be captured as a test result
   * @param options comparison rule for this test result
   */
  public check(key: string, value: unknown, options?: CheckOptions): void {
    if (this._active_case) {
      const touca_value = this._type_handler.transform(value);
      this._cases.get(this._active_case)?.check(key, touca_value, options);
    }
  }

  /**
   * Captures an external file as a data point for the declared
   * test case and associates it with the specified key.
   *
   * @param key name to be associated with the captured file
   * @param path path to the external file to be captured
   */
  public checkFile(key: string, path: string) {
    if (this._active_case) {
      this._cases.get(this._active_case)?.checkFile(key, path);
    }
  }

  /**
   * Logs a given value as an assertion for the declared test case
   * and associates it with the specified key.
   *
   * @param key name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  public assume(key: string, value: unknown): void {
    if (this._active_case) {
      const touca_value = this._type_handler.transform(value);
      this._cases.get(this._active_case)?.assume(key, touca_value);
    }
  }

  /**
   * Adds a given value to a list of results for the declared
   * test case which is associated with the specified key.

   * Could be considered as a helper utility function.
   * This method is particularly helpful to log a list of items as they
   * are found:
   *
   * ```js
   *  for (const number of numbers) {
   *    if (is_prime(number)) {
   *      touca.add_array_element("prime numbers", number);
   *      touca.add_hit_count("number of primes");
   *    }
   *  }
   * ```
   *
   * This pattern can be considered as a syntactic sugar for the following
   * alternative:
   *
   * ```js
   *  const primes = [];
   *  for (const number of numbers) {
   *    if (is_prime(number)) {
   *      primes.push(number);
   *    }
   *  }
   *  if (primes.length !== 0) {
   *    touca.check("prime numbers", primes);
   *    touca.check("number of primes", primes.length);
   *  }
   * ```
   *
   * The items added to the list are not required to be of the same type.
   * The following code is acceptable:
   *
   * ```js
   * touca.check("prime numbers", 42);
   * touca.check("prime numbers", "forty three");
   * ```
   *
   * @throws if specified key is already associated with a test result which
   *         was not iterable
   * @param key name to be associated with the logged test result
   * @param value element to be appended to the array
   * @see {@link check}
   */
  public add_array_element(key: string, value: unknown): void {
    if (this._active_case) {
      const touca_value = this._type_handler.transform(value);
      this._cases.get(this._active_case)?.add_array_element(key, touca_value);
    }
  }

  /**
   * Increments value of key every time it is executed.
   * creates the key with initial value of one if it does not exist.
   *
   * Could be considered as a helper utility function.
   * This method is particularly helpful to track variables whose values
   * are determined in loops with indeterminate execution cycles:
   *
   * ```js
   *  for (const number of numbers) {
   *    if (is_prime(number)) {
   *      touca.add_array_element("prime numbers", number);
   *      touca.add_hit_count("number of primes");
   *    }
   *  }
   * ```
   *
   * This pattern can be considered as a syntactic sugar for the following
   * alternative:
   *
   * ```js
   *  const primes = []
   *  for (const number of numbers) {
   *    if (is_prime(number)) {
   *      primes.push(number);
   *    }
   *  }
   *  if (primes.length !== 0) {
   *    touca.check("prime numbers", primes);
   *    touca.check("number of primes", primes.length);
   *  }
   * ```
   *
   * @throws if specified key is already associated with a test result
   *         which was not an integer
   *
   * @param key name to be associated with the logged test result
   * @see {@link check}
   */
  public add_hit_count(key: string): void {
    if (this._active_case) {
      this._cases.get(this._active_case)?.add_hit_count(key);
    }
  }

  /**
   * Adds an already obtained measurements to the list of captured
   * performance benchmarks.
   *
   * Useful for logging a metric that is measured without using this SDK.
   *
   * @param key name to be associated with this performance benchmark
   * @param milliseconds duration of this measurement in milliseconds
   */
  public add_metric(key: string, milliseconds: number): void {
    if (this._active_case) {
      this._cases.get(this._active_case)?.add_metric(key, milliseconds);
    }
  }

  /**
   * Starts timing an event with the specified name.
   *
   * Measurement of the event is only complete when function
   * {@link stop_timer} is later called for the specified name.
   *
   * @param key name to be associated with the performance metric
   */
  public start_timer(key: string): void {
    if (this._active_case) {
      this._cases.get(this._active_case)?.start_timer(key);
    }
  }

  /**
   * Stops timing an event with the specified name.
   *
   * Expects function {@link stop_timer} to have been called previously
   * with the specified name.
   *
   * @param key name to be associated with the performance metric
   */
  public stop_timer(key: string): void {
    if (this._active_case) {
      this._cases.get(this._active_case)?.stop_timer(key);
    }
  }

  public async scoped_timer<T>(
    key: string,
    callback: () => Promise<T>
  ): Promise<T> {
    this.start_timer(key);
    const v = await callback();
    this.stop_timer(key);
    return v;
  }

  /**
   * Registers custom serialization logic for a given custom data type.
   *
   * Calling this function is rarely needed. The library already handles
   * all custom data types by serializing all their properties. Custom
   * serializers allow you to exclude a subset of an object properties
   * during serialization.
   */
  public add_serializer(
    type: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serializer: (x: any) => any
  ): void {
    this._type_handler.add_serializer(type, serializer);
  }

  /**
   * Stores test results and performance benchmarks in binary format
   * in a file of specified path.
   *
   * Touca binary files can be submitted at a later time to the Touca
   * server.
   *
   * We do not recommend as a general practice for regression test tools
   * to locally store their test results. This feature may be helpful for
   * special cases such as when regression test tools have to be run in
   * environments that have no access to the Touca server (e.g. running
   * with no network access).
   *
   * @param path path to file in which test results and performance
   *             benchmarks should be stored.
   * @param cases names of test cases  whose results should be stored.
   *              If a set is not specified or is set as empty, all
   *              test cases will be stored in the specified file.
   */
  public async save_binary(path: string, cases: string[] = []): Promise<void> {
    const items = this._prepare_save(path, cases);
    const content = this._serialize(items);
    writeFileSync(path, content, { flag: 'w+' });
  }

  /**
   * Stores test results and performance benchmarks in JSON format
   * in a file of specified path.
   *
   * This feature may be helpful during development of regression tests
   * tools for quick inspection of the test results and performance metrics
   * being captured.
   *
   * @param path path to file in which test results and performance
   *             benchmarks should be stored.
   * @param cases names of test cases  whose results should be stored.
   *              If a set is not specified or is set as empty, all
   *              test cases will be stored in the specified file.
   */
  public async save_json(path: string, cases: string[] = []): Promise<void> {
    const items = this._prepare_save(path, cases);
    const content = JSON.stringify(items.map((item) => item.json()));
    writeFileSync(path, content, { flag: 'w+' });
  }

  /**
   * Submits all test results recorded so far to Touca server.
   *
   * It is possible to call {@link post} multiple times during runtime
   * of the regression test tool. Test cases already submitted to the server
   * whose test results have not changed, will not be resubmitted.
   * It is also possible to add test results to a testcase after it is
   * submitted to the server. Any subsequent call to {@link post} will
   * resubmit the modified test case.
   *
   * @throws when called on the client that is not configured to communicate
   *         with the Touca server.
   *
   * @returns a promise that is resolved when all test results are submitted.
   */
  public async post(): Promise<void> {
    if (!this._transport) {
      throw new Error('client not configured to perform this operation');
    }
    if (!this._transport.has_token()) {
      throw new Error('client not authenticated');
    }
    const content = this._serialize(Array.from(this._cases.values()));
    await this._transport.post(content);
    for (const [name, testcase] of this._cases.entries()) {
      for (const [key, value] of testcase.blobs()) {
        await this._transport.postArtifact(name, key, value.binary());
      }
    }
  }

  /**
   * Notifies the Touca server that all test cases were executed for this
   * version and no further test result is expected to be submitted.
   * Expected to be called by the test tool once all test cases are executed
   * and all test results are posted.
   *
   * Sealing the version is optional. The Touca server automatically
   * performs this operation once a certain amount of time has passed since
   * the last test case was submitted. This duration is configurable from
   * the "Settings" tab in "Suite" Page.
   *
   * @throws when called on the client that is not configured to communicate
   *         with the Touca server.
   *
   * @returns a promise that is resolved when the version is sealed.
   */
  public async seal(): Promise<void> {
    if (!this._transport) {
      throw new Error('client not configured to perform this operation');
    }
    if (!this._transport.has_token()) {
      throw new Error('client not authenticated');
    }
    return this._transport.seal();
  }

  public async run(): Promise<void> {
    return await this._runner.run();
  }

  public async workflow(
    name: string,
    callback: Workflow['callback'],
    options?: Omit<Workflow, 'callback'>
  ): Promise<void> {
    this._runner.add_workflow(name, { callback, ...options });
  }
}
