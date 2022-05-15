// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { PlatformConfig } from '@/core/models/commontypes';
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
  private installed = false;
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
    this.switchTab(InstallPageTabType.UserInfo);
  }

  ngOnDestroy() {
    this._subHints.unsubscribe();
  }

  submitContactInfo(model: FormContent) {
    if (!this.installForm.valid) {
      return;
    }
    const contact = {
      company: model.company,
      email: model.email,
      name: model.fname
    };
    const route = this.installed
      ? this.apiService.patch('/platform/config', { contact })
      : this.apiService.post('/platform/install', contact);
    route.subscribe({
      next: () => {
        this.hints.reset();
        this.installForm.reset({}, { emitEvent: false });
        this.tabType = InstallPageTabType.Telemetry;
      },
      error: (err: HttpErrorResponse) => {
        const error = this.apiService.extractError(err, [
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
      .patch('/platform/config', { telemetry: this.telemetry })
      .subscribe((doc) => {
        this.tabType = InstallPageTabType.Thanks;
        this.apiService._status = undefined;
        if (doc.url) {
          this.router.navigate(['/account/activate'], {
            queryParams: { key: doc.url }
          });
        }
      });
  }

  switchTab(tabType: InstallPageTabType) {
    this.tabType = tabType;
    if (this.tabType == InstallPageTabType.UserInfo) {
      this.apiService
        .get<PlatformConfig>('/platform/config')
        .subscribe((doc) => {
          if (doc.contact) {
            this.installForm.setValue({
              company: doc.contact.company,
              email: doc.contact.email,
              fname: doc.contact.name
            });
          }
          this.installed = true;
        });
    }
  }

  navigateToSignup() {
    this.router.navigate(['/account/signup']);
  }
}
