// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export const environment = {
  apiUrl: 'https://api.touca.io',
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  appVersion: require('../../package.json').version,
  dataRefreshInterval: 60_000,
  github_client_id: '6ac76b117e2823d111c2',
  google_api_client_id:
    '232474004917-li0ioanjkoi6lj6vq2intei2kv7op5li.apps.googleusercontent.com',
  self_hosted: false,
  production: true
};
