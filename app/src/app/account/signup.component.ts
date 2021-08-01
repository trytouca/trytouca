/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, NgZone } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { MailboxAction, MailboxInput } from '@/account/mailbox.component';
import { PlatformStatus } from '@/core/models/commontypes';
import { formFields } from '@/core/models/form-hint';
import { ApiService, AuthService, UserService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';

interface FormContent {
  email: string;
}

@Component({
  selector: 'app-account-signup',
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  /**
   *
   */
  formSignup = new FormGroup({
    email: new FormControl('', {
      validators: formFields.email.validators,
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
  showForm: boolean;

  /**
   *
   */
  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private userService: UserService,
    private zone: NgZone
  ) {
    this.apiService.status().subscribe((response) => {
      this.showForm = response.self_hosted;
    });
  }

  /**
   *
   */
  onSubmit(model: FormContent) {
    if (!this.formSignup.valid) {
      return;
    }
    this.apiService.post('/auth/signup', { email: model.email }).subscribe({
      next: () => {
        this.alert = undefined;
        this.isFormShown = false;
      },
      error: (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'email is invalid', 'Your email address appears invalid.'],
          [
            400,
            'email already registered',
            'There is already an account associated with this email address.'
          ],
          [
            403,
            'email address suspicious',
            'Please use an email address with a different domain.'
          ]
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    });
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

  /**
   *
   */
  signupGoogle() {
    this.authService.google_login().subscribe({
      next: () => {
        this.userService.populate();
        this.zone.run(() => {
          this.router.navigate([this.authService.redirectUrl || '/~']);
        });
      },
      error: (err) => {
        const msg = this.apiService.extractError(err, [
          [
            403,
            'feature not available',
            'Feature not available for self-hosted deployments.'
          ],
          [401, 'account not verified', 'Your Google account is not verified.'],
          [423, 'account suspended', 'Your account is currently suspended.'],
          [423, 'account locked', 'Your account is temporarily locked.']
        ]);
        this.zone.run(() => {
          this.alert = { type: AlertType.Danger, text: msg };
        });
      }
    });
  }
}
