// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { formFields, FormHint, FormHints } from '@/core/models/form-hint';
import { ApiService, UserService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';

interface FormContent {
  fname: string;
  upass: string;
}

@Component({
  selector: 'app-account-onboard',
  templateUrl: './onboard.component.html'
})
export class OnboardComponent implements OnDestroy {
  private _subHints: Subscription;
  alert: Alert;

  onboardForm = new FormGroup({
    fname: new FormControl('', {
      validators: formFields.fname.validators,
      updateOn: 'blur'
    }),
    upass: new FormControl('', {
      validators: formFields.upass.validators,
      updateOn: 'change'
    })
  });

  hints = new FormHints({
    fname: new FormHint(
      'We do not share your full name other than with your team members.',
      formFields.fname.validationErrors
    ),
    upass: new FormHint(
      'Use a strong password, please.',
      formFields.upass.validationErrors
    )
  });

  constructor(
    private router: Router,
    private apiService: ApiService,
    private userService: UserService
  ) {
    this._subHints = this.hints.subscribe(this.onboardForm, ['fname', 'upass']);
  }

  ngOnDestroy() {
    this._subHints.unsubscribe();
  }

  onSubmit(model: Partial<FormContent>) {
    if (!this.onboardForm.valid) {
      return;
    }
    const info = {
      fullname: model.fname,
      password: model.upass
    };
    this.apiService.patch('/user', info).subscribe({
      next: () => {
        this.alert = undefined;
        this.hints.reset();
        this.onboardForm.reset({}, { emitEvent: false });
        this.userService.populate();
        this.router.navigate(['/~']);
      },
      error: (err: HttpErrorResponse) => {
        const error = this.apiService.extractError(err, [
          [401, 'invalid login credentials', 'Incorrect username or password.']
        ]);
        this.alert = { text: error, type: AlertType.Danger };
      }
    });
  }
}
