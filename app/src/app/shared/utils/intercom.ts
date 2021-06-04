/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { environment } from 'src/environments/environment';

import { UserLookupResponse } from '@/core/models/commontypes';

/**
 *
 */
class IntercomClient {
  public boot(user?: UserLookupResponse) {
    if (environment.intercomId === '') {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    (window as any).Intercom('boot', {
      app_id: environment.intercomId,
      user_id: user?.user_id,
      user_hash: user?.user_hash
    });
  }
  public shutdown() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    (window as any).Intercom('shutdown');
  }
  public update() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    (window as any).Intercom('update');
  }
}

export const intercomClient = new IntercomClient();
