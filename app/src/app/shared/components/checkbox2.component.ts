// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { nanoid } from 'nanoid';

@Component({
  selector: 'app-checkbox',
  template: `
    <label [for]="slug">
      <div class="relative cursor-pointer">
        <input
          class="sr-only"
          type="checkbox"
          [id]="slug"
          [checked]="value"
          (change)="toggle.emit(value)" />
        <div
          class="wsl-checkbox-line block h-5 w-8 rounded-full bg-gray-200 dark:bg-gray-600"></div>
        <div
          class="wsl-checkbox-dot absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition dark:bg-gray-800"></div>
      </div>
    </label>
  `,
  styles: [
    `
      input:checked ~ .wsl-checkbox-line {
        background-color: #0284c7;
      }
      input:checked ~ .wsl-checkbox-dot {
        transform: translateX(100%);
      }
    `
  ]
})
export class Checkbox2Component {
  protected readonly slug: string = nanoid(8);
  @Input() value: boolean;
  @Output() toggle = new EventEmitter<boolean>();
}
