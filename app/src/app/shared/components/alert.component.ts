// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export enum AlertType {
  Danger,
  Info,
  Success,
  Warning
}

export interface Alert {
  text: string;
  type: AlertType;
}

@Component({
  selector: 'app-alert',
  template: `
    <div *ngIf="alert" role="alert" class="border" [ngClass]="lookupClasses()">
      <small [innerHTML]="alert.text" class="text-sm font-normal"></small>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent {
  @Input() alert: Alert;

  lookupClasses(): string[] {
    const entries = new Map<AlertType, string[]>([
      [
        AlertType.Danger,
        [
          'bg-red-100',
          'border-red-200',
          'text-red-800',
          'dark:bg-red-900',
          'dark:border-red-800',
          'dark:text-gray-100'
        ]
      ],
      [
        AlertType.Info,
        [
          'bg-sky-100',
          'border-sky-200',
          'text-sky-800',
          'dark:bg-sky-900',
          'dark:border-sky-800',
          'dark:text-gray-200'
        ]
      ],
      [
        AlertType.Success,
        [
          'bg-green-100',
          'border-green-200',
          'text-green-800',
          'dark:bg-green-900',
          'dark:border-green-800',
          'dark:text-gray-200'
        ]
      ],
      [
        AlertType.Warning,
        [
          'bg-yellow-100',
          'border-yellow-200',
          'text-yellow-800',
          'dark:bg-sky-900',
          'dark:border-sky-800',
          'dark:text-gray-200'
        ]
      ]
    ]);
    const base = ['py-3', 'px-5', 'rounded-md', 'shadow-sm'];
    return base.concat(entries.get(this.alert.type));
  }
}
