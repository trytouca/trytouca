// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IAccountInfo } from '@/account/reset-apply.component';
import { ApiService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';

@Component({
  selector: 'app-account-reset',
  template: `
    <ng-container *ngIf="!accountInfo">
      <app-account-reset-start [input]="accountError"></app-account-reset-start>
    </ng-container>
    <ng-container *ngIf="accountInfo">
      <app-account-reset-apply [input]="accountInfo"></app-account-reset-apply>
    </ng-container>
  `
})
export class ResetComponent {
  accountInfo: IAccountInfo;
  accountError: Alert;

  constructor(private route: ActivatedRoute, private apiService: ApiService) {
    const qmap = this.route.snapshot.queryParamMap;
    if (qmap.has('key')) {
      const resetKey = qmap.get('key');
      this.apiService.get<IAccountInfo>(`/auth/reset/${resetKey}`).subscribe({
        next: (doc) => {
          this.accountInfo = { ...doc, resetKey };
        },
        error: (err: HttpErrorResponse) => {
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
      });
    }
  }
}
