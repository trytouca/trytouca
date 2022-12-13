// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import http, { IncomingMessage, RequestOptions } from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

import { VERSION } from './version.js';

export class Transport {
  private _node?: { key: string; url: string; token?: string };

  async authenticate(api_url: string, api_key: string) {
    if (
      this._node?.token &&
      this._node?.key === api_key &&
      this._node?.url === api_url
    ) {
      return;
    }
    this._node = { url: api_url, key: api_key };
    const response = await this.request(
      'POST',
      `/client/signin`,
      JSON.stringify({ key: api_key })
    );
    if (response.status === 401) {
      throw new Error('Authentication failed: API Key Invalid');
    }
    if (response.status !== 200) {
      throw new Error('Authentication failed: Invalid Response');
    }
    const body: { token: string; expiresAt: Date } = JSON.parse(response.body);
    this._node.token = body.token;
  }

  async request(
    method: 'POST' | 'GET',
    path: string,
    content: string | Uint8Array = '',
    contentType:
      | 'application/json'
      | 'application/octet-stream' = 'application/json'
  ) {
    const url = new URL(this._node?.url + path);
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
        'User-Agent': `touca-client-js/${VERSION}`
      }
    };
    if (this._node?.token && options.headers) {
      options.headers['Authorization'] = `Bearer ${this._node.token}`;
    }
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
            : reject(new Error(`HTTP request failed: ${options.path}`))
        );
      });
      req.on('error', reject);
      req.write(content, 'binary');
      req.end();
    });
  }
}
