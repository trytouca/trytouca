/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { environment } from 'src/environments/environment';

/**
 * We used to use bugsnag to post remotely log error messages in production
 * environment. We chose to remove this feature, at least temporarily, to
 * maintain simplicity and reduce frontend dependencies. We keep the framework
 * `ErrorLogger` in place, in case we wanted to bring this feature back in
 * future versions.
 */
class ErrorLogger {
  constructor() {}

  public notify(error: Error) {
    if (!environment.production) {
      console.warn('encountered error:', error.message);
    }
    console.error(error);
  }
}

export const errorLogger = new ErrorLogger();
