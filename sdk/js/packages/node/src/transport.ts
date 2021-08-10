// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NodeOptions } from './options';

/**
 *
 */
export class Transport {
  private _token?: string;
  private _options: NodeOptions;

  private _handshake(): void {}

  constructor(options: NodeOptions) {
    this._options = options;
    this._handshake();
  }

  get options(): NodeOptions {
    return this._options;
  }

  public update_options(options: string[]): void {
    if (['api_key', 'api_url'].filter((k) => k in options).length !== 0) {
      this._token = undefined;
    }
    // this._options.update(options);
    this._handshake();
  }

  public async authenticate(): Promise<void> {}

  public async get_testcases(): Promise<string[]> {
    return Promise.resolve([]);
  }

  public async post(content: Uint8Array): Promise<boolean> {
    return Promise.resolve(true);
  }

  public async seal(): Promise<boolean> {
    return Promise.resolve(false);
  }

  public has_token(): boolean {
    return this._token?.length !== 0;
  }
}
