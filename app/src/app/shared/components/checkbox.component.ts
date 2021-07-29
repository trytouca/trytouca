/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Checkbox {
  default: boolean;
  description: string;
  experimental: boolean;
  saved?: boolean;
  slug: string;
  title: string;
  value?: boolean;
}

@Component({
  selector: 'app-settings-checkbox',
  templateUrl: './checkbox.component.html',
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
export class CheckboxComponent {
  @Input() data: Checkbox;
  @Output() toggle = new EventEmitter<Checkbox>();
}
