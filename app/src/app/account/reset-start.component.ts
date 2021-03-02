/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';
import { MailboxAction, MailboxInput } from '@weasel/account/mailbox.component';

interface FormContent {
  email: string;
}

@Component({
  selector: 'wsl-account-reset-start',
  templateUrl: './reset-start.component.html'
})
export class ResetStartComponent {
  /**
   *
   */
  formReset = new FormGroup({
    email: new FormControl('', {
      validators: [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ],
      updateOn: 'blur'
    })
  });

  /**
   *
   */
  mailboxInput: MailboxInput = {
    textAfterSuccess: 'Did not receive the email? We can send you a new one.',
    textAfterFailure: 'Still not in your inbox? Maybe try one more time?',
    textFailure: 'We sent you another email. Maybe check your spam folder?',
    textSuccess: 'We sent you an email to complete your password reset.'
  };

  alert: Alert;
  isFormShown = true;
  @Input() input: Alert;

  /**
   *
   */
  constructor(private apiService: ApiService) {}

  /**
   *
   */
  onSubmit(model: FormContent) {
    if (this.formReset.pristine) {
      return;
    }
    if (!this.formReset.valid) {
      return;
    }
    this.apiService.post('/auth/reset', { email: model.email }).subscribe(
      () => {
        this.alert = undefined;
        this.isFormShown = false;
      },
      (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.'],
          [
            404,
            'account not found',
            'This email is not associated with any account.'
          ],
          [423, 'account suspended', 'Your account is currently suspended.'],
          [423, 'account locked', 'Your account is temporarily locked.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    );
  }

  /**
   * Requests for another password reset email in case the original email did
   * not get through.
   */
  onResend() {
    this.apiService
      .post('/auth/reset/resend', this.formReset.value)
      .subscribe();
  }

  /**
   *
   */
  mailboxAction(action: MailboxAction) {
    if (action === MailboxAction.Back) {
      this.isFormShown = true;
      this.formReset.reset();
    } else if (action === MailboxAction.Resend) {
      this.isFormShown = false;
      this.onResend();
    }
  }

  /**
   * Determines if help tip should be shown below the input field.
   */
  isFormValid() {
    const field = this.formReset.controls['email'];
    return field.pristine || field.valid;
  }
}
