// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { timer } from 'rxjs';

import { formFields } from '@/core/models/form-hint';
import { ApiService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';

export interface IAccountInfo {
  email: string;
  fullname: string;
  username: string;
  resetKey: string;
}

interface FormContent {
  uname: string;
  upass1: string;
  upass2: string;
}

@Component({
  selector: 'app-account-reset-apply',
  templateUrl: './reset-apply.component.html'
})
export class ResetApplyComponent {
  formReset = new FormGroup(
    {
      uname: new FormControl('', {
        validators: [Validators.required]
      }),
      upass1: new FormControl('', {
        validators: formFields.upass.validators,
        updateOn: 'change'
      }),
      upass2: new FormControl('', {
        validators: [Validators.required],
        updateOn: 'change'
      })
    },
    {
      validators: this.passwordMatchValidator
    }
  );

  accountInfo: IAccountInfo;
  alert: Alert;

  @Input() set input(v: IAccountInfo) {
    this.accountInfo = v;
    this.formReset.get('uname').setValue(v.username);
    this.formReset.get('uname').disable();
  }

  constructor(private router: Router, private apiService: ApiService) {}

  onSubmit(model: Partial<FormContent>) {
    if (!this.formReset.valid) {
      return;
    }
    const body = {
      username: this.accountInfo.username,
      password: model.upass1
    };
    this.apiService
      .post(`/auth/reset/${this.accountInfo.resetKey}`, body)
      .subscribe({
        next: () => {
          this.alert = {
            type: AlertType.Success,
            text: 'Your password is reset.'
          };
          this.formReset.reset();
          timer(3000).subscribe(() => {
            this.router.navigate(['/account/signin']);
          });
        },
        error: (err: HttpErrorResponse) => {
          const msg = this.apiService.extractError(err, [
            [
              400,
              'request invalid',
              'Your request was rejected by the server.'
            ],
            [
              400,
              'reset key invalid',
              'Your reset link was invalid or expired.'
            ]
          ]);
          this.alert = { type: AlertType.Danger, text: msg };
        }
      });
  }

  passwordMatchValidator(fromGroup: FormGroup) {
    return fromGroup.get('upass1').value === fromGroup.get('upass2').value
      ? null
      : { mismatch: true };
  }

  shouldHideAriaDescriptionForUpass1(): boolean {
    const field = this.formReset.controls['upass1'];
    return field.pristine || field.valid;
  }

  shouldHideAriaDescriptionForUpass2(): boolean {
    const field = this.formReset.controls['upass2'];
    return field.pristine || (field.valid && this.formReset.valid);
  }
}
