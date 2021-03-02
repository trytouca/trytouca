/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { Subscription, timer } from 'rxjs';

export enum MailboxAction {
  Back = 0,
  Resend
}

export interface MailboxInput {
  textAfterFailure: string;
  textAfterSuccess: string;
  textFailure: string;
  textSuccess: string;
}

@Component({
  selector: 'wsl-account-mailbox',
  templateUrl: './mailbox.component.html'
})
export class MailboxComponent implements OnDestroy {
  @Input() input: MailboxInput;
  @Output() action = new EventEmitter<MailboxAction>();

  isBackButtonShown = false;
  isRetry = false;
  private _sub: Subscription;

  constructor() {
    this.reset();
  }

  ngOnDestroy() {
    this._sub.unsubscribe();
  }

  back() {
    this.action.emit(MailboxAction.Back);
  }

  resend() {
    this.isRetry = true;
    this.reset();
    this.action.emit(MailboxAction.Resend);
  }

  private reset() {
    this.isBackButtonShown = false;
    this._sub = timer(30000).subscribe(() => {
      this.isBackButtonShown = true;
    });
  }
}
