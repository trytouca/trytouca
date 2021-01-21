/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { NotificationService } from '@weasel/core/services';
import { Alert } from '@weasel/shared/components/alert.component';

@Component({
  selector: 'app-notification',
  template: `
    <app-alert *ngIf="showNotification" [alert]="alert" class="fixed top-20 right-4 text-sm"></app-alert>
  `
})
export class NotificationComponent implements OnDestroy {

  alert: Alert
  showNotification = false;
  timer: Subscription;

  private _subNotification: Subscription;

  constructor(private notificationService: NotificationService) {
    this._subNotification = this.notificationService.notification$.subscribe(([type, message]) => {
      this.alert = { type: type, text: message };
      this.showNotification = true;
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
