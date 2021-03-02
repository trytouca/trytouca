/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';

interface FormContent {
  email: string;
}

@Component({
  selector: 'wsl-account-reset',
  templateUrl: './reset.component.html'
})
export class ResetComponent {
  formReset = new FormGroup({
    email: new FormControl('', {
      validators: [
        Validators.required,
        Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$')
      ],
      updateOn: 'blur'
    })
  });
  alert: Alert;

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
        this.formReset.reset();
        this.alert = {
          type: AlertType.Success,
          text: 'Please check your email for a link to reset your password.'
        };
      },
      (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.'],
          [
            404,
            'account not found',
            'Your email is not associated with any account.'
          ],
          [423, 'account suspended', 'Your account is currently suspended.'],
          [423, 'account locked', 'Your account is temporarily locked.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    );
  }

  /**
   * Determines if help tip should be shown below the input field.
   */
  isFormValid() {
    const field = this.formReset.controls['email'];
    return field.pristine || field.valid;
  }
}
