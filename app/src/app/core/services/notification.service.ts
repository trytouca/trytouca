/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Injectable } from '@angular/core';
import { AlertType } from '@weasel/shared/components/alert.component';
import { Subject } from 'rxjs';

@Injectable()
export class NotificationService {
  private _subject = new Subject<[AlertType, string]>();

  notification$ = this._subject.asObservable();

  public notify(type: AlertType, message: string): void {
    this._subject.next([type, message]);
  }
}
