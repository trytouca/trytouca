// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Checkbox2 {
  default: boolean;
  saved?: boolean;
  slug: string;
  value?: boolean;
}

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox2.component.html',
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
  @Input() data: Checkbox2;
  @Output() toggle = new EventEmitter<Checkbox2>();
}
