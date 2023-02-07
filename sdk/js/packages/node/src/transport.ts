// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import http, { IncomingMessage, RequestOptions } from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

import { ToucaError } from './options.js';
import { VERSION } from './version.js';

export class Transport {
  private _api_key?: string;
  private _api_url?: string;

  async configure(api_url: string, api_key: string) {
    if (this._api_key === api_key && this._api_url === api_url) {
      return;
    }
    this._api_key = api_key;
    this._api_url = api_url;
    const response = await this.request('POST', `/client/verify`);
    if (response.status === 401) {
      throw new ToucaError('auth_invalid_key');
    }
    if (response.status !== 204) {
      throw new ToucaError('auth_invalid_response', response.status);
    }
  }

  async request(
    method: 'POST' | 'GET',
    path: string,
    content: string | Uint8Array = '',
    contentType:
      | 'application/json'
      | 'application/octet-stream' = 'application/json',
    headers: { 'X-Touca-Submission-Mode'?: 'sync' | 'async' } = {}
  ) {
    const url = new URL((this._api_url + path).replace(/\/\//g, '/'));
    const options: RequestOptions = {
      protocol: url.protocol,
      host: url.host,
      port: url.port,
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: {
        Accept: 'application/json',
        'Accept-Charset': 'utf-8',
        'Content-Type': contentType,
        'User-Agent': `touca-client-js/${VERSION}`,
        'X-Touca-API-Key': this._api_key,
        ...headers
      }
    };
    const protocol = url.protocol === 'https:' ? https.request : http.request;
    return new Promise<{
      body: string;
      status: number;
    }>((resolve, reject) => {
      const req = protocol(options, (res: IncomingMessage) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk.toString()));
        res.on('error', reject);
        res.on('end', () =>
          res.statusCode
            ? resolve({ status: res.statusCode, body })
            : reject(new ToucaError('transport_http', options.path))
        );
      });
      req.on('error', reject);
      req.write(content, 'binary');
      req.end();
    });
  }
}
