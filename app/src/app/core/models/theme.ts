// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { ELocalStorageKey } from './frontendtypes';

export function getUserPreference(key: string) {
  const content = JSON.parse(
    localStorage.getItem(ELocalStorageKey.Preferences) || '{}'
  );
  return content[key];
}

export function setUserPreference(
  key: string,
  value: string | Record<string, unknown> | null
) {
  const content = JSON.parse(
    localStorage.getItem(ELocalStorageKey.Preferences) || '{}'
  );
  if (value === null) {
    delete content[key];
  } else {
    content[key] = value;
  }
  localStorage.setItem(ELocalStorageKey.Preferences, JSON.stringify(content));
}

export function toggleAppearance(mode: 'dark' | 'light' | 'system') {
  setUserPreference('theme', mode === 'system' ? null : mode);
  applyAppearance();
}

export function applyAppearance() {
  const mode = getUserPreference('theme');
  const darkMode =
    mode === 'dark' ||
    (!mode && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function listenToAppearanceChange() {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => e.matches && applyAppearance());
  window
    .matchMedia('(prefers-color-scheme: light)')
    .addEventListener('change', (e) => e.matches && applyAppearance());
}
