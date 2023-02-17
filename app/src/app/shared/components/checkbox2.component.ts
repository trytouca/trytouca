// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { nanoid } from 'nanoid';

export class Checkbox2 {
  readonly slug: string = nanoid(8);
  public saved = false;
  public value: boolean;
  constructor(initial: boolean) {
    this.value = initial;
  }
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
