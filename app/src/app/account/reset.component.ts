/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Alert } from '@weasel/shared/components/alert.component';

interface FormContent {
  umail: string;
}

@Component({
  selector: 'wsl-account-reset',
  templateUrl: './reset.component.html'
})
export class ResetComponent {
  formReset = new FormGroup({
    umail: new FormControl('', {
      validators: [Validators.required, Validators.email],
      updateOn: 'blur'
    })
  });
  alert: Alert;

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
    console.log(model);
  }

  /**
   * Determines if help tip should be shown below the input field.
   */
  isFormValid() {
    const field = this.formReset.controls['umail'];
    return field.pristine || field.valid;
  }
}
