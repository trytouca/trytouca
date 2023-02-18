// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import type { UserLookupResponse } from '@touca/api-schema';
import { Subscription, timer } from 'rxjs';

import { formFields, FormHint, FormHints } from '@/core/models/form-hint';
import { ApiRequestType, ApiService, UserService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';

enum EModalType {
  ChangePersonal = 'changePersonal',
  DeleteAccount = 'deleteAccount'
}

interface FormContent {
  fname: string;
}

@Component({
  selector: 'app-settings-tab-profile',
  templateUrl: './profile.component.html'
})
export class SettingsTabProfileComponent implements OnDestroy {
  private _subHints: Subscription;
  alert: Partial<Record<EModalType, Alert>> = {};
  EModalType = EModalType;
  user: UserLookupResponse;

  accountSettingsForm = new FormGroup({
    email: new FormControl('', {
      validators: formFields.email.validators,
      updateOn: 'blur'
    }),
    fname: new FormControl('', {
      validators: formFields.fname.validators,
      updateOn: 'blur'
    }),
    uname: new FormControl('', {
      validators: formFields.uname.validators,
      updateOn: 'blur'
    })
  });

  hints = new FormHints({
    email: new FormHint(
      'Contact us if you like to change your email address',
      formFields.email.validationErrors
    ),
    fname: new FormHint('', formFields.fname.validationErrors),
    uname: new FormHint('', formFields.uname.validationErrors)
  });

  resetPassword: {
    click: () => void;
    failed: boolean;
    message?: string;
  } = {
    click: () => this.resetPasswordAction(),
    failed: false
  };

  @Input()
  set userInfo(input: UserLookupResponse) {
    this.accountSettingsForm.get('email').setValue(input.email);
    this.accountSettingsForm.get('email').disable();
    this.accountSettingsForm.get('fname').setValue(input.fullname);
    this.accountSettingsForm.get('uname').setValue(input.username);
    this.accountSettingsForm.get('uname').disable();
    this.user = input;
  }

  @Output() confirmAccountDelete = new EventEmitter();

  constructor(
    private apiService: ApiService,
    private userService: UserService
  ) {
    this._subHints = this.hints.subscribe(this.accountSettingsForm, ['fname']);
  }

  ngOnDestroy() {
    if (this._subHints) {
      this._subHints.unsubscribe();
    }
  }

  onSubmit(model: Partial<FormContent>) {
    if (!this.accountSettingsForm.valid) {
      return;
    }
    const info: { fullname?: string } = {};
    if (this.user.fullname !== model.fname) {
      info.fullname = model.fname;
    }
    if (Object.keys(info).length === 0) {
      return;
    }
    this.apiService.patch('/user', info).subscribe({
      next: () => {
        this.alert.changePersonal = {
          type: AlertType.Success,
          text: 'Your account information was updated.'
        };
        timer(5000).subscribe(() => (this.alert.changePersonal = undefined));
        this.hints.reset();
        this.userService.reset();
        this.userService.populate();
      },
      error: (err: HttpErrorResponse) => {
        const error = this.apiService.extractError(err, []);
        timer(2000).subscribe(() => {
          this.alert.changePersonal = undefined;
          this.hints.reset();
          this.userService.reset();
          this.userService.populate();
        });
        this.alert.changePersonal = { text: error, type: AlertType.Danger };
      }
    });
  }

  resetPasswordAction(): void {
    this.apiService
      .post(ApiRequestType.ResetStart, { email: this.user.email })
      .subscribe({
        next: () => {
          this.resetPassword.message = 'Done. Check your inbox!';
          timer(10000).subscribe(() => {
            this.resetPassword.message = undefined;
          });
        },
        error: (err: HttpErrorResponse) => {
          const el = this.apiService.findErrorList(ApiRequestType.ResetStart);
          const msg = this.apiService.extractError(err, el);
          this.resetPassword.message = msg;
          this.resetPassword.failed = true;
          timer(10000).subscribe(() => {
            this.resetPassword.message = undefined;
            this.resetPassword.failed = false;
          });
        }
      });
  }
}
