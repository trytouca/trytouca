/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

/**
 *
 */
export interface BaseOptions {
  apiKey?: string;
  apiUrl?: string;
  version?: string;
  suite?: string;
  team?: string;
  handshake?: boolean;
  postTestcases?: number;
  postMaxRetries?: number;
  concurrencyMode?: 'all-threads' | 'per-thread';
}

/**
 *
 */
export interface BaseClient<Options extends BaseOptions> {
  init(options: Options): void;
  testcase(slug: string): void;
  add_result(key: string, value: unknown): void;
  post(timeout?: number): PromiseLike<boolean>;
}
