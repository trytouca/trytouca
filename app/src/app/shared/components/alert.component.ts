/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export enum AlertType {
  Success = 'wsl-alert-success',
  Danger = 'wsl-alert-danger'
}

export interface Alert {
  text: string;
  type: AlertType;
}

@Component({
  selector: 'app-alert',
  template: `
    <div *ngIf="alert" role="alert" class="wsl-alert" [ngClass]="alert.type">
      <small [innerHtml]="alert.text" class="wsl-alert-text"></small>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent {
  @Input() alert: Alert;
}
