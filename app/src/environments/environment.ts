// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export const environment = {
  apiUrl: 'http://localhost:8080/api',
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  appVersion: `${require('../../package.json').version as string}-dev`,
  dataRefreshInterval: 60_000,
  google_api_client_id:
    '232474004917-li0ioanjkoi6lj6vq2intei2kv7op5li.apps.googleusercontent.com',
  github_client_id: '',
  self_hosted: true,
  production: false
};
