/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { NotificationService, NotificationType } from 'src/app/core/services';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnDestroy {

  message: string;
  alertType: string;
  showNotification = false;
  timer: Subscription;
  private alerts = new Map<number, string>([
    [ NotificationType.Info, 'info' ],
    [ NotificationType.Success, 'success' ],
    [ NotificationType.Warning, 'warning' ],
    [ NotificationType.Error, 'danger' ],
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
