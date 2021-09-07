// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { environment } from 'src/environments/environment';

export function getBackendUrl(): string {
  const env = environment.apiUrl;
  return env.startsWith('http') ? env : document.location.origin + env;
}
