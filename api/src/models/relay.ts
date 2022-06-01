// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import * as https from 'https'

export async function relay(
  path: string,
  data = ''
): Promise<{ status: number }> {
  const url = new URL('https://api.touca.io')
  const options: https.RequestOptions = {
    protocol: url.protocol,
    host: url.host,
    port: url.port,
    hostname: url.hostname,
    path,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Charset': 'utf-8',
      'Content-Type': 'application/json'
    }
  }
  return new Promise((resolve, reject) => {
    const req = https.request(options, (remoteResponse) => {
      return resolve({ status: remoteResponse.statusCode })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}
