/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService, UserService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';
import { FormHint, formFields } from '@weasel/account/form-hint';

interface FormContent {
  fname: string;
  uname: string;
  upass: string;
}

@Component({
  selector: 'wsl-account-onboard',
  templateUrl: './onboard.component.html'
})
export class OnboardComponent implements OnDestroy {
  /**
   *
   */
  onboardForm = new FormGroup({
    fname: new FormControl('', {
      validators: formFields.fname.validators,
      updateOn: 'blur'
    }),
    uname: new FormControl('', {
      validators: formFields.uname.validators,
      updateOn: 'blur'
    }),
    upass: new FormControl('', {
      validators: formFields.upass.validators,
      updateOn: 'blur'
    })
  });

  /**
   *
   */
  help: Record<keyof FormContent, FormHint> = {
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
  };

  alert: Alert;
  private _sub: Partial<Record<keyof FormContent, Subscription>> = {};

  /**
   *
   */
  constructor(
    private router: Router,
    private apiService: ApiService,
    private userService: UserService
  ) {
    ['fname', 'uname', 'upass'].forEach((key: 'fname' | 'uname' | 'upass') => {
      const group = this.onboardForm.get(key);
      this._sub[key] = group.statusChanges.subscribe(() => {
        const help = this.help[key];
        if (!group.errors) {
          help.setSuccess();
          return;
        }
        const errorTypes = Object.keys(group.errors);
        if (errorTypes.length === 0) {
          help.unsetError();
          return;
        }
        help.setError(errorTypes[0]);
      });
    });
  }

  /**
   *
   */
  ngOnDestroy() {
    Object.values(this._sub).forEach((s) => s.unsubscribe());
  }

  /**
   *
   */
  onSubmit(model: FormContent) {
    if (!this.onboardForm.valid) {
      return;
    }
    const info = {
      fullname: model.fname,
      username: model.uname,
      password: model.upass
    };
    this.apiService.patch('/user', info).subscribe(
      () => {
        this.alert = undefined;
        Object.values(this.help).forEach((v) => v.setSuccess());
        this.onboardForm.reset({}, { emitEvent: false });
        this.userService.populate();
        this.router.navigate(['/~']);
      },
      (err) => {
        const error = this.apiService.extractError(err, [
          [409, 'username already registered', 'This username is taken'],
          [401, 'invalid login credentials', 'Incorrect username or password.']
        ]);
        this.alert = { text: error, type: AlertType.Danger };
      }
    );
  }
}
