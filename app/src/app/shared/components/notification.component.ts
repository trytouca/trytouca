/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { NotificationService } from '@weasel/core/services';
import { Alert } from '@weasel/shared/components/alert.component';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-notification',
  template: `
    <app-alert
      *ngIf="showNotification"
      [alert]="alert"
      class="fixed z-20 top-20 right-4 text-sm"
    ></app-alert>
  `
})
export class NotificationComponent implements OnDestroy {
  alert: Alert;
  showNotification = false;
  timers: Subscription[] = [];

  private _subNotification: Subscription;

  constructor(private notificationService: NotificationService) {
    this._subNotification = this.notificationService.notification$.subscribe(
      ([type, message]) => {
        let delay = 0;
        if (this.showNotification) {
          this.showNotification = false;
          delay += 100;
        }
        this.alert = { type: type, text: message };
        this.timers.filter(Boolean).forEach((v) => v.unsubscribe());
        this.timers.push(
          timer(delay).subscribe(() => (this.showNotification = true))
        );
        this.timers.push(
          timer(delay + 2000).subscribe(() => (this.showNotification = false))
        );
      }
    );
  }

  ngOnDestroy() {
    this._subNotification.unsubscribe();
    this.timers.filter(Boolean).forEach((v) => v.unsubscribe());
  }
}
