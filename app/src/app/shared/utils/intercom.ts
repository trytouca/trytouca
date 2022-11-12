// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

/* eslint-disable @typescript-eslint/no-unsafe-call */

import type { UserLookupResponse } from '@touca/api-schema';

class IntercomClient {
  public get enabled() {
    return false;
  }
  public load() {
    if (!this.enabled) {
      return;
    }
  }
  public remove() {
    if (!this.enabled) {
      return;
    }
  }
  public setUser(user: UserLookupResponse) {
    if (!this.enabled) {
      return;
    }
  }
}

export const intercomClient = new IntercomClient();
