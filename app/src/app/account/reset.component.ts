/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '@weasel/core/services';
import { IAccountInfo } from '@weasel/account/reset-apply.component';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';

@Component({
  selector: 'wsl-account-reset',
  template: `
    <ng-container *ngIf="!accountInfo">
      <wsl-account-reset-start [input]="accountError"></wsl-account-reset-start>
    </ng-container>
    <ng-container *ngIf="accountInfo">
      <wsl-account-reset-apply [input]="accountInfo"></wsl-account-reset-apply>
    </ng-container>
  `
})
export class ResetComponent {
  accountInfo: IAccountInfo;
  accountError: Alert;

  /**
   *
   */
  constructor(private route: ActivatedRoute, private apiService: ApiService) {
    const qmap = this.route.snapshot.queryParamMap;
    if (qmap.has('key')) {
      const resetKey = qmap.get('key');
      this.apiService.get<IAccountInfo>(`/auth/reset/${resetKey}`).subscribe(
        (doc) => {
          this.accountInfo = { ...doc, resetKey };
        },
        (err) => {
          const msg = this.apiService.extractError(err, [
            [
              400,
              'request invalid',
              'Your request was rejected by the server.'
            ],
            [400, 'reset key invalid', 'Your reset link is invalid.'],
            [400, 'reset key expired', 'Your reset link is expired.']
          ]);
          this.accountError = { type: AlertType.Danger, text: msg };
        }
      );
    }
  }
}
