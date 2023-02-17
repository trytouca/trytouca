// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Checkbox {
  default: boolean;
  description: string;
  experimental: boolean;
  saved?: boolean;
  slug: string;
  title: string;
  value?: boolean;
  visible: boolean;
}

@Component({
  selector: 'app-settings-checkbox',
  template: `
    <div class="flex items-center justify-between">
      <div class="space-x-1">
        <span class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ data.title }}
        </span>
      </div>
      <div class="flex items-center space-x-1">
        <span class="text-xs text-green-600" *ngIf="data.saved">Saved</span>
        <app-checkbox [value]="data.value" (toggle)="toggle.emit()" />
      </div>
    </div>
    <small class="wsl-text-muted" id="wsl-beta-color-help">
      {{ data.description }}
    </small>
  `
})
export class CheckboxComponent {
  @Input() data: Checkbox;
  @Output() toggle = new EventEmitter<Checkbox>();
}
