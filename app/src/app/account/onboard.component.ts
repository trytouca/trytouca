// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { formFields, FormHint, FormHints } from '@/core/models/form-hint';
import { ApiService, UserService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';

interface FormContent {
  fname: string;
  uname: string;
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
    uname: new FormControl('', {
      validators: formFields.uname.validators,
      updateOn: 'change'
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
    uname: new FormHint(
      'You can always update your information from the <i>Account Settings</i> page.',
      formFields.uname.validationErrors
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
    this._subHints = this.hints.subscribe(this.onboardForm, [
      'fname',
      'uname',
      'upass'
    ]);
  }

  ngOnDestroy() {
    this._subHints.unsubscribe();
  }

  onSubmit(model: FormContent) {
    if (!this.onboardForm.valid) {
      return;
    }
    const info = {
      fullname: model.fname,
      username: model.uname,
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
      error: (err) => {
        const error = this.apiService.extractError(err, [
          [409, 'username already registered', 'This username is taken'],
          [401, 'invalid login credentials', 'Incorrect username or password.']
        ]);
        this.alert = { text: error, type: AlertType.Danger };
      }
    });
  }
}
