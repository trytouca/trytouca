/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService, UserService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';

interface FormContent {
  fname: string;
  uname: string;
  upass: string;
}

/**
 *
 */
class FormHint {
  private _text: string;
  private _type: string;

  /**
   *
   */
  constructor(
    private initial: string,
    private errorMap: { [key: string]: string } = {},
    private success?: string
  ) {
    this._text = initial;
    this._type = 'wsl-text-muted';
  }
  setError(key: string): void {
    if (key in this.errorMap) {
      this._text = this.errorMap[key];
      this._type = 'wsl-text-danger';
    }
  }
  setSuccess(): void {
    this._text = this.success ?? this.initial;
    this._type = this.success ? 'wsl-text-success' : 'wsl-text-muted';
  }
  unsetError(): void {
    this._text = this.initial;
    this._type = 'wsl-text-muted';
  }
  get text(): string {
    return this._text;
  }
  get type(): string {
    return this._type;
  }
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
        Validators.maxLength(32),
        Validators.pattern('[a-zA-Z0-9]+')
      ],
      updateOn: 'blur'
    }),
    upass: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(64)
      ],
      updateOn: 'blur'
    })
  });

  /**
   *
   */
  help: Record<'fname' | 'uname' | 'upass', FormHint> = {
    fname: new FormHint(
      'We do not share your full name other than with your team members.',
      {
        required: 'This field is required.',
        maxlength: 'Our engineers did not expect more than 128 characters.',
        minlength: 'This field cannot be empty.'
      }
    ),
    uname: new FormHint(
      'You can always update your information from the <i>Account Settings</i> page.',
      {
        required: 'This field is required.',
        maxlength: 'Username can be at most 32 characters.',
        minlength: 'Username can be at least 3 characters.',
        pattern: 'Username can only contain alphanumeric characters.'
      }
    ),
    upass: new FormHint('Use a strong password, please.', {
      required: 'This field is required.',
      minlength: 'Password must be at least 8 characters.',
      maxlength: 'Password must be at most 64 characters.'
    })
  };

  alert: Alert;
  private _sub: Partial<Record<'fname' | 'uname' | 'upass', Subscription>> = {};

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
