/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { timer, Subscription } from 'rxjs';
import { ApiService } from '@weasel/core/services';
import { Alert } from '@weasel/shared/components/alert.component';

interface FormContent {
  umail: string;
}

@Component({
  selector: 'wsl-account-signup',
  templateUrl: './signup.component.html',
  styles: []
})
export class SignupComponent implements OnDestroy {
  formSignup = new FormGroup({
    umail: new FormControl('', {
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
    this.isFormShown = false;
    this.subBackButton = timer(30000).subscribe(() => {
      this.isBackButtonShown = true;
    });
  }

  /**
   * Determines if help tip should be shown below the input field.
   */
  isFormValid() {
    const field = this.formSignup.controls['umail'];
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
