/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { timer } from 'rxjs';
import { ApiService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';

interface IAccountInfo {
  email: string;
  fullname: string;
  username: string;
}

interface IRequestFormContent {
  email: string;
}

interface IResetFormContent {
  uname: string;
  upass1: string;
  upass2: string;
}

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html'
})
export class ResetComponent {
  _resetKey: string;
  _accountInfo: IAccountInfo;
  alert: Alert;
  submitted: boolean;
  shouldShowResetForm = false;

  /**
   *
   */
  requestForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      updateOn: 'blur'
    })
  });

  /**
   *
   */
  resetForm = new FormGroup(
    {
      uname: new FormControl('', {
        validators: [Validators.required]
      }),
      upass1: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(64)
        ],
        updateOn: 'blur'
      }),
      upass2: new FormControl('', {
        validators: [Validators.required],
        updateOn: 'blur'
      })
    },
    {
      validators: this.passwordMatchValidator
    }
  );

  /**
   *
   */
  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const qmap = this.route.snapshot.queryParamMap;
    if (qmap.has('key')) {
      const resetKey = qmap.get('key');
      this.apiService.get<IAccountInfo>(`/auth/reset/${resetKey}`).subscribe(
        (doc) => {
          this._accountInfo = doc;
          this._resetKey = resetKey;
          this.resetForm.get('uname').setValue(doc.username);
          this.resetForm.get('uname').disable();
          this.shouldShowResetForm = true;
        },
        (err) => {
          const msg = this.apiService.extractError(err, [
            [
              400,
              'request invalid',
              'Your request was rejected by the server.'
            ],
            [400, 'reset key invalid', 'Your reset link is invalid.'],
            [400, 'reset key expired', 'Your reset link is expired.']
          ]);
          this.alert = { type: AlertType.Warning, text: msg };
        }
      );
    }
  }

  /**
   *
   */
  passwordMatchValidator(fromGroup: FormGroup) {
    return fromGroup.get('upass1').value === fromGroup.get('upass2').value
      ? null
      : { mismatch: true };
  }

  /**
   *
   */
  shouldHideAriaDescriptionForEmail(): boolean {
    const e = this.requestForm.controls.email;
    return (!this.submitted && e.pristine) || e.valid;
  }

  /**
   *
   */
  shouldHideAriaDescriptionForUpass1(): boolean {
    const u = this.resetForm.controls.upass1;
    return (!this.submitted && u.pristine) || u.valid;
  }

  /**
   *
   */
  shouldHideAriaDescriptionForUpass2(): boolean {
    const u = this.resetForm.controls.upass2;
    return (!this.submitted && u.pristine) || this.resetForm.valid;
  }

  /**
   *
   */
  onRequestSubmission(model: IRequestFormContent) {}

  /**
   *
   */
  onResetSubmission(model: IResetFormContent) {
    if (!this.resetForm.valid) {
      return;
    }
    this.submitted = true;
    const body = {
      username: this._accountInfo.username,
      password: model.upass1
    };
    this.apiService.post(`/auth/reset/${this._resetKey}`, body).subscribe(
      () => {
        this.alert = {
          type: AlertType.Success,
          text: 'Your password is reset.'
        };
        this.resetForm.reset();
        this.submitted = false;
        this.shouldShowResetForm = false;
        timer(3000).subscribe(() => {
          this.router.navigate(['/signin']);
        });
      },
      (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.'],
          [400, 'reset key invalid', 'Your reset link was invalid or expired.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    );
  }
}
