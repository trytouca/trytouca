/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { environment } from 'src/environments/environment';

export function getBackendUrl(): string {
  const env = environment.apiUrl;
  return env.startsWith('http') ? env : document.location.origin + env;
}
