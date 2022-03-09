// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

declare global {
  interface Window {
    plausible: (action: string, props: Record<string, unknown>) => void;
  }
}

export const tracker = {
  track(event: { action: string }, data?: Record<string, unknown>): void {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(event.action, { props: data });
    }
  }
};
