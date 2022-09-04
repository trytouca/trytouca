// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import * as https from 'https'

export async function relay(opts: {
  path: string
  host?: string
  data?: unknown
  authorization?: string
}): Promise<{ status: number }> {
  const url = new URL(opts.host ?? 'https://api.touca.io')
  const options: https.RequestOptions = {
    protocol: url.protocol,
    host: url.host,
    port: url.port,
    hostname: url.hostname,
    path: opts.path,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Charset': 'utf-8',
      'Content-Type': 'application/json'
    }
  }
  if (opts.authorization) {
    options.headers['Authorization'] = opts.authorization
  }
  return new Promise((resolve, reject) => {
    const req = https.request(options, (remoteResponse) => {
      return resolve({ status: remoteResponse.statusCode })
    })
    req.on('error', reject)
    req.write(opts.data ?? '')
    req.end()
  })
}
