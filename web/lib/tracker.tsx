// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

declare global {
  interface Window {
    plausible: (action: string, props: Record<string, unknown>) => void;
  }
}

class Tracker {
  constructor() {
    if (MIXPANEL_TOKEN) {
      mixpanel.init(MIXPANEL_TOKEN);
    }
  }
  track(event: { action: string }, data?: Record<string, unknown>): void {
    if (MIXPANEL_TOKEN) {
      mixpanel.track(event.action, data);
    }
    if (window.plausible) {
      window.plausible(event.action, { props: data });
    }
  }
}

export const tracker = new Tracker();
