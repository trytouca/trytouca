// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

import { NodeOptions } from './options.js';
import { VERSION } from './version.js';

interface Response {
  body: string;
  status: number;
}

interface Request {
  method: 'POST' | 'GET';
  path: string;
  body?: string | Uint8Array;
  content_type?: 'application/octet-stream' | 'application/json';
}

interface ElementListResponseItem {
  metricsDuration: number;
  name: string;
  slug: string;
}

interface AuthResponse {
  token: string;
  expiresAt: Date;
}

interface PlatformStatus {
  mail: boolean;
  ready: boolean;
  self_hosted: boolean;
}

export class Transport {
  private _token?: string;
  private _options: NodeOptions;

  constructor(options: NodeOptions) {
    this._options = { ...options };
    this._handshake();
  }

  private async _handshake(): Promise<void> {
    const response = await this._send_request({
      method: 'GET',
      path: '/platform'
    });
    if (response.status !== 200) {
      throw new Error('could not communicate with touca server');
    }
    const content = JSON.parse(response.body) as PlatformStatus;
    if (!content.ready) {
      throw new Error('touca server is not ready');
    }
  }

  private async _request(
    options: http.RequestOptions,
    data: string | Uint8Array = ''
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const transport =
        options.protocol === 'https:' ? require('https') : require('http');
      const req = transport.request(options, (res: http.IncomingMessage) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk.toString()));
        res.on('error', reject);
        res.on('end', () => {
          if (!res.statusCode) {
            return reject(new Error(`HTTP request failed: ${options.path}`));
          }
          return resolve({ status: res.statusCode, body });
        });
      });
      req.on('error', reject);
      req.write(data, 'binary');
      req.end();
    });
  }

  /**
   * @todo find a better way to set path without using regex
   */
  private async _send_request(args: Request): Promise<Response> {
    if (!args.content_type) {
      args.content_type = 'application/json';
    }
    const url = new URL(this._options.api_url as string);
    const options: http.RequestOptions = {
      protocol: url.protocol,
      host: url.host,
      port: url.port,
      hostname: url.hostname,
      path: url.pathname.concat(args.path).replace(/\/\//g, '/'),
      method: args.method,
      headers: {
        Accept: 'application/json',
        'Accept-Charset': 'utf-8',
        'Content-Type': args.content_type,
        'User-Agent': `touca-client-js/${VERSION}`
      }
    };
    if (this._token && options.headers) {
      options.headers['Authorization'] = `Bearer ${this._token}`;
    }
    return this._request(options, args.body);
  }

  public update_options(options: NodeOptions): void {
    if (['api_key', 'api_url'].filter((k) => k in options).length !== 0) {
      this._token = undefined;
      this._handshake();
    }
    this._options = { ...this._options, ...options };
  }

  public async authenticate(): Promise<void> {
    if (this._token) {
      return;
    }
    const response = await this._send_request({
      method: 'POST',
      path: '/client/signin',
      body: JSON.stringify({ key: this._options.api_key })
    });
    if (response.status === 401) {
      throw new Error('Authentication failed: API Key Invalid');
    }
    if (response.status !== 200) {
      throw new Error('Authentication failed: Invalid Response');
    }
    const body = JSON.parse(response.body) as AuthResponse;
    this._token = body.token;
  }

  public async get_testcases(): Promise<string[]> {
    const team = this._options.team;
    const suite = this._options.suite;
    const response = await this._send_request({
      method: 'GET',
      path: `/client/element/${team}/${suite}`
    });
    if (response.status !== 200) {
      throw new Error('Failed to obtain list of test cases');
    }
    const body = JSON.parse(response.body) as ElementListResponseItem[];
    return body.map((k) => k.name);
  }

  public async getNextBatch(): Promise<string> {
    const team = this._options.team;
    const suite = this._options.suite;
    const response = await this._send_request({
      method: 'GET',
      path: `/client/batch/${team}/${suite}/next`
    });
    if (response.status !== 200) {
      throw new Error('Failed to find next version');
    }
    const body = JSON.parse(response.body) as { batch: string };
    return body.batch;
  }

  public async post(content: Uint8Array): Promise<void> {
    return this.postBinary(content);
  }

  public async postArtifact(testcase: string, key: string, content: Buffer) {
    const path = `/client/submit/artifact/${this._options.team}/${this._options.suite}/${this._options.version}/${testcase}/${key}`;
    return this.postBinary(content, path);
  }

  private async postBinary(content: Uint8Array, path = '/client/submit') {
    const response = await this._send_request({
      method: 'POST',
      path,
      body: content,
      content_type: 'application/octet-stream'
    });
    if (response.status === 204) {
      return;
    }
    let reason = '';
    if (response.status === 400) {
      if (response.body.includes('batch is sealed')) {
        reason = ' This version is already submitted and sealed';
      }
      if (response.body.includes('team not found')) {
        reason = ' This team does not exist';
      }
      throw new Error(`Failed to submit test results.${reason}`);
    }
  }

  public async seal(): Promise<void> {
    const slugs = [
      this._options.team,
      this._options.suite,
      this._options.version
    ].join('/');
    const response = await this._send_request({
      method: 'POST',
      path: `/batch/${slugs}/seal2`
    });
    if (response.status !== 204) {
      throw new Error('Failed to seal this version');
    }
  }

  public has_token(): boolean {
    return this._token !== undefined;
  }

  public get options(): NodeOptions {
    return this._options;
  }
}
