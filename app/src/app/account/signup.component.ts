/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';
import { MailboxAction, MailboxInput } from '@weasel/account/mailbox.component';

interface FormContent {
  email: string;
}

@Component({
  selector: 'wsl-account-signup',
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  /**
   *
   */
  formSignup = new FormGroup({
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
    textSuccess: 'We sent you an email to complete your account registration.'
  };

  alert: Alert;
  isFormShown = true;

  /**
   *
   */
  constructor(private apiService: ApiService) {}

  /**
   *
   */
  onSubmit(model: FormContent) {
    if (this.formSignup.pristine) {
      return;
    }
    if (!this.formSignup.valid) {
      return;
    }
    this.apiService.post('/auth/signup', model).subscribe(
      () => {
        this.alert = undefined;
        this.isFormShown = false;
      },
      (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'email is invalid', 'Your email address appears invalid.'],
          [
            400,
            'email already registered',
            'There is already an account associated with this email address.'
          ]
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    );
  }

  /**
   * Requests for another welcome email in case the original email did not get
   * through.
   */
  onResend() {
    this.apiService
      .post('/auth/signup/resend', this.formSignup.value)
      .subscribe();
  }

  /**
   *
   */
  mailboxAction(action: MailboxAction) {
    if (action === MailboxAction.Back) {
      this.isFormShown = true;
      this.formSignup.reset();
    } else if (action === MailboxAction.Resend) {
      this.isFormShown = false;
      this.onResend();
    }
  }

  /**a
   * Determines if help tip should be shown below the input field.
   */
  isFormValid() {
    const field = this.formSignup.controls['email'];
    return field.pristine || field.valid;
  }
}
