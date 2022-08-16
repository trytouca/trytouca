// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export const environment = {
  apiUrl: '/api',
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  appVersion: require('../../package.json').version,
  dataRefreshInterval: 10000,
  google_api_client_id: '',
  self_hosted: true,
  production: true
};
