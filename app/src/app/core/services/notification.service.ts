/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 *
 */
export enum NotificationType {
  Info = 1,
  Success,
  Warning,
  Error
}

@Injectable()
export class NotificationService {

  private _subject = new Subject<[NotificationType, string]>();

  notification$ = this._subject.asObservable();

  public notify(type: NotificationType, message: string): void {
    this._subject.next([type, message]);
  }
}
