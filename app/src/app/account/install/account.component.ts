// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { concat, Subscription } from 'rxjs';

import { formFields, FormHint, FormHints } from '@/core/models/form-hint';
import { InstallPageTabType } from '@/core/models/frontendtypes';
import { ApiService, AuthService } from '@/core/services';

interface FormContent {
  uname: string;
  upass: string;
}

@Component({
  selector: 'app-account-install-account',
  templateUrl: './account.component.html',
  styles: []
})
export class InstallAccountComponent implements OnDestroy {
  private _subHints: Subscription;
  @Output() switchTab = new EventEmitter<{
    error?: string;
    next?: InstallPageTabType;
  }>();

  installAccountForm = new FormGroup({
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
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this._subHints = this.hints.subscribe(this.installAccountForm, [
      'uname',
      'upass'
    ]);
  }

  ngOnDestroy() {
    this._subHints.unsubscribe();
  }

  onSubmit(model: Partial<FormContent>) {
    if (!this.installAccountForm.valid) {
      return;
    }
    concat(
      this.apiService.patch('/platform/config', {
        credentials: {
          username: model.uname,
          password: model.upass
        }
      }),
      this.authService.login(model.uname, model.upass)
    ).subscribe({
      next: () => {
        this.hints.reset();
        this.installAccountForm.reset({}, { emitEvent: false });
        this.switchTab.emit({ next: 'telemetry' });
      },
      error: (err: HttpErrorResponse) => {
        const error = this.apiService.extractError(err, []);
        this.switchTab.emit({ error });
      }
    });
  }
}
