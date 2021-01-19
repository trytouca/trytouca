/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { NotificationService, NotificationType } from '@weasel/core/services';

@Component({
  selector: 'app-notification',
  template: `
    <div [hidden]="!showNotification" role="alert" class="wsl-alert fixed top-20 right-4 text-sm" [ngClass]="alertType">
      {{ message }}
    </div>
  `
})
export class NotificationComponent implements OnDestroy {

  message: string;
  alertType: string;
  showNotification = false;
  timer: Subscription;
  private alerts = new Map<number, string>([
    [ NotificationType.Info, 'wsl-alert-info' ],
    [ NotificationType.Success, 'wsl-alert-success' ],
    [ NotificationType.Warning, 'wsl-alert-warning' ],
    [ NotificationType.Error, 'wsl-alert-danger' ],
  ]);

  private _subNotification: Subscription;

  constructor(private notificationService: NotificationService) {
    this._subNotification = this.notificationService.notification$.subscribe(([type, message]) => {
      this.message = message;
      this.showNotification = true;
      this.alertType = this.alerts.get(type);
      if (this.timer) {
        this.timer.unsubscribe();
      }
      this.timer = timer(2000).subscribe(() => this.showNotification = false);
    });
  }

  ngOnDestroy() {
    this._subNotification.unsubscribe();
  }

}
