// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { MailboxAction, MailboxInput } from '@/account/mailbox.component';
import { formFields } from '@/core/models/form-hint';
import { ApiService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';

interface FormContent {
  email: string;
}

@Component({
  selector: 'app-account-reset-start',
  templateUrl: './reset-start.component.html'
})
export class ResetStartComponent {
  formReset = new FormGroup({
    email: new FormControl('', {
      validators: formFields.email.validators,
      updateOn: 'blur'
    })
  });

  mailboxInput: MailboxInput = {
    textAfterSuccess: 'Did not receive the email? We can send you a new one.',
    textAfterFailure: 'Still not in your inbox? Maybe try one more time?',
    textFailure: 'We sent you another email. Maybe check your spam folder?',
    textSuccess: 'Check your email to complete your password reset.'
  };

  alert: Alert;
  isFormShown = true;
  @Input() input: Alert;

  constructor(private apiService: ApiService) {}

  onSubmit(model: FormContent) {
    if (this.formReset.pristine) {
      return;
    }
    if (!this.formReset.valid) {
      return;
    }
    this.apiService.post('/auth/reset', { email: model.email }).subscribe({
      next: () => {
        this.alert = undefined;
        this.isFormShown = false;
      },
      error: (err: HttpErrorResponse) => {
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
    });
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
