/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { timer, Subscription } from 'rxjs';
import { ApiService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';

interface FormContent {
  email: string;
}

@Component({
  selector: 'wsl-account-signup',
  templateUrl: './signup.component.html',
  styles: []
})
export class SignupComponent implements OnDestroy {
  formSignup = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      updateOn: 'blur'
    })
  });
  alert: Alert;
  isFormShown = true;
  isBackButtonShown = false;
  subBackButton: Subscription;

  /**
   *
   */
  constructor(private apiService: ApiService) {}

  /**
   *
   */
  ngOnDestroy() {
    if (this.subBackButton) {
      this.subBackButton.unsubscribe();
    }
  }

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
        this.subBackButton = timer(30000).subscribe(() => {
          this.isBackButtonShown = true;
        });
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

  /**a
   * Determines if help tip should be shown below the input field.
   */
  isFormValid() {
    const field = this.formSignup.controls['email'];
    return field.pristine || field.valid;
  }

  /**
   * Allows user to go back to the signup form once they have registered and
   * submitted the form.
   */
  showForm() {
    this.isBackButtonShown = false;
    this.isFormShown = true;
    this.formSignup.reset();
  }

  /**
   * Allows user to request another welcome email in case the original email
   * did not get through.
   *
   * @todo instead of attempting to re-register user, we should create a
   *       separate backend route that only resends the welcome email.
   */
  resendEmail() {
    this.isBackButtonShown = false;
    this.onSubmit(this.formSignup.value);
  }
}
