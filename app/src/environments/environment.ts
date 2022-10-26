// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export const environment = {
  apiUrl: 'http://localhost:8080/api',
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  appVersion: `${require('../../package.json').version as string}-dev`,
  //   @remove
  dataRefreshInterval: 1000 * 60 * 60,
  google_api_client_id: '',
  self_hosted: true,
  production: false
};
