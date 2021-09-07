// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { environment } from 'src/environments/environment';

/**
 * We used to use bugsnag to post remotely log error messages in production
 * environment. We chose to remove this feature, at least temporarily, to
 * maintain simplicity and reduce frontend dependencies. We keep the framework
 * `ErrorLogger` in place, in case we wanted to bring this feature back in
 * future versions.
 */
class ErrorLogger {
  public notify(error: Error) {
    if (!environment.production) {
      console.warn('encountered error:', error.message);
    }
    console.error(error);
  }
}

export const errorLogger = new ErrorLogger();
