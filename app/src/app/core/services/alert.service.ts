/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export enum AlertKind {
  ApiConnectionDown = 1,
  ApiConnectionLost,
  InvalidAuthToken,
  UserNotVerified,

  TeamNotFound,
  SuiteNotFound,
  BatchNotFound,
  ElementNotFound,
  // SuiteEmpty,
  // DstSuiteNotFound,
  // DstBatchNotFound,
  // DstElementNotFound,
  // DstSuiteEmpty
}

export enum AlertType {
  Feedback = 'wsl-alert-success',
  Info = 'wsl-alert-info',
  Reminder = 'wsl-alert-primary',
  Warning = 'wsl-alert-warning',
  Error = 'wsl-alert-danger'
}

export type Alert = {
  kind: AlertKind;
  type: AlertType;
  message?: string;
};

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private _alerts = new Set<AlertKind>();
  private _alertsSubject = new Subject<Alert[]>();
  alerts$ = this._alertsSubject.asObservable();

  private _alertList: Alert[] = [
    {
      kind: AlertKind.ApiConnectionDown,
      type: AlertType.Error
    },
    {
      kind: AlertKind.ApiConnectionLost,
      type: AlertType.Warning,
      message: 'Some of our services are not available at this time. '
        + 'Please allow some time for these services to be restored.'
    },
    {
      kind: AlertKind.InvalidAuthToken,
      type: AlertType.Error,
      message: 'Your session has expired. Please login once again.'
    },
    {
      kind: AlertKind.UserNotVerified,
      type: AlertType.Reminder,
      message: 'Please check your mailbox to complete your account activation.'
    },
    { kind: AlertKind.TeamNotFound, type: AlertType.Error },
    { kind: AlertKind.SuiteNotFound, type: AlertType.Error },
    { kind: AlertKind.BatchNotFound, type: AlertType.Error },
    { kind: AlertKind.ElementNotFound, type: AlertType.Error },
  ];

  /**
   *
   */
  private publish(): void {
    const alerts = Array.from(this._alerts).map(v => {
      return this._alertList.find(k => k.kind === v) || { kind: v, type: AlertType.Info };
    });
    this._alertsSubject.next(alerts);
  }

  /**
   *
   */
  public set(...keys: AlertKind[]): void {
    for (const key of keys) {
      this._alerts.add(key);
    }
    this.publish();
  }

  /**
   *
   */
  public unset(...keys: AlertKind[]): void {
    for (const key of keys) {
      this._alerts.delete(key);
    }
    this.publish();
  }

}
