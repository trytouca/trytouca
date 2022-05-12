// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { formFields, FormHint, FormHints } from '@/core/models/form-hint';
import { ApiService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';
import { Checkbox } from '@/shared/components/checkbox.component';

enum InstallPageTabType {
  UserInfo = 'userInfo',
  Telemetry = 'telemetry',
  Thanks = 'thanks'
}

interface FormContent {
  fname: string;
  email: string;
  company: string;
}

@Component({
  selector: 'app-account-install',
  templateUrl: './install.component.html'
})
export class InstallComponent implements OnDestroy {
  private _subHints: Subscription;
  TabType = InstallPageTabType;
  tabType = InstallPageTabType.UserInfo;
  alert: Alert;
  preference = {
    default: true,
    description: 'Can we collect aggregate anonymous usage data?',
    experimental: false,
    saved: false,
    slug: 'telemetry',
    title: 'Anonymous Usage Data',
    visible: true
  };
  telemetry = this.preference.default;

  installForm = new FormGroup({
    fname: new FormControl('', {
      validators: formFields.fname.validators,
      updateOn: 'blur'
    }),
    email: new FormControl('', {
      validators: formFields.email.validators,
      updateOn: 'change'
    }),
    company: new FormControl('', {
      updateOn: 'change'
    })
  });

  hints = new FormHints({
    fname: new FormHint(
      'This is the only time we are asking you to submit something personal to us.',
      formFields.fname.validationErrors
    ),
    email: new FormHint(
      'We will not use this address to send you marketing emails.',
      formFields.email.validationErrors
    ),
    company: new FormHint('', formFields.fname.validationErrors)
  });

  constructor(private apiService: ApiService, private router: Router) {
    this._subHints = this.hints.subscribe(this.installForm, [
      'fname',
      'email',
      'company'
    ]);
  }

  ngOnDestroy() {
    this._subHints.unsubscribe();
  }

  onSubmit(model: FormContent) {
    if (!this.installForm.valid) {
      return;
    }
    const info = {
      name: model.fname,
      email: model.email,
      cname: model.company,
      page: 'install',
      body: 'New Self-Hosted Install'
    };
    this.apiService.post('/feedback', info).subscribe({
      next: () => {
        this.hints.reset();
        this.installForm.reset({}, { emitEvent: false });
        this.tabType = InstallPageTabType.Telemetry;
      },
      error: (err: HttpErrorResponse) => {
        const error = this.apiService.extractError(err, [
          [409, 'username already registered', 'This username is taken'],
          [401, 'invalid login credentials', 'Incorrect username or password.']
        ]);
        this.alert = { text: error, type: AlertType.Danger };
      }
    });
  }

  toggleFeatureFlag(flag: Checkbox) {
    this.telemetry = flag.value;
  }

  submitTelemetry() {
    this.apiService
      .patch('/platform', { telemetry: this.telemetry })
      .subscribe(() => {
        this.tabType = InstallPageTabType.Thanks;
        this.apiService._status = undefined;
      });
  }

  navigateToSignup() {
    this.router.navigate(['/account/signup']);
  }
}
