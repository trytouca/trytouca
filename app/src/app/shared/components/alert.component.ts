/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

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
    <div *ngIf="alert" role="alert" [ngClass]="lookupClasses()">
      <small [innerHtml]="alert.text" class="font-normal text-sm"></small>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent {
  @Input() alert: Alert;

  lookupClasses(): string[] {
    const entries = new Map<AlertType, string[]>([
      [ AlertType.Danger, [ 'bg-red-100', 'border-red-200', 'text-red-800' ] ],
      [ AlertType.Info, [ 'bg-lblue-100', 'border-lblue-200', 'text-lblue-800' ] ],
      [ AlertType.Success, [ 'bg-green-100', 'border-green-200', 'text-green-800' ] ],
      [ AlertType.Warning, [ 'bg-yellow-100', 'border-yellow-200', 'text-yellow-800' ] ],
    ]);
    const base = ['py-3', 'px-5', 'mb-4', 'rounded-md', 'shadow-sm'];
    return base.concat(entries.get(this.alert.type));
  }
}
