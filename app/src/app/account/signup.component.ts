/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
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
export class SignupComponent {
  formSignup = new FormGroup({
    umail: new FormControl('', {
      validators: [Validators.required, Validators.email],
      updateOn: 'blur'
    })
  });
  alert: Alert;
  submitted: boolean;
  prev: FormContent;

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
    if (this.prev === model) {
      return;
    }
    this.submitted = true;
    console.log(model);
  }
}
