/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '@weasel/core/services';
import { Alert } from '@weasel/shared/components/alert.component';

interface FormContent {
  uname: string;
  upass: string;
}

@Component({
  selector: 'wsl-account-signin',
  templateUrl: './signin.component.html'
})
export class SigninComponent {
  formSignin = new FormGroup({
    uname: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern('[a-zA-Z0-9]+')
      ],
      updateOn: 'blur'
    }),
    upass: new FormControl('', {
      validators: [Validators.required, Validators.minLength(8)],
      updateOn: 'change'
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
    if (this.formSignin.pristine) {
      return;
    }
    if (!this.formSignin.valid) {
      return;
    }
    if (this.prev === model) {
      return;
    }
    this.submitted = true;
    console.log(model);
  }
}
