/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';

interface FormContent {
  fname: string;
  uname: string;
  upass: string;
}

@Component({
  selector: 'wsl-account-onboard',
  templateUrl: './onboard.component.html'
})
export class OnboardComponent {
  onboardForm = new FormGroup({
    fname: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(128)
      ],
      updateOn: 'blur'
    }),
    uname: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern('[a-zA-Z][a-zA-Z0-9]+')
      ],
      updateOn: 'blur'
    }),
    upass: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(64)
      ],
      updateOn: 'change'
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
    if (this.onboardForm.pristine) {
      return;
    }
    if (!this.onboardForm.valid) {
      return;
    }
  }
}
