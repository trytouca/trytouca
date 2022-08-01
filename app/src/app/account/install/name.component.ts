// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import type { PlatformConfig } from '@touca/api-schema';
import { Subscription } from 'rxjs';

import { formFields, FormHint, FormHints } from '@/core/models/form-hint';
import type { InstallPageTabType } from '@/core/models/frontendtypes';
import { ApiService } from '@/core/services';

interface FormContent {
  fname: string;
  email: string;
  company: string;
}

@Component({
  selector: 'app-account-install-name',
  templateUrl: './name.component.html'
})
export class InstallNameComponent implements OnDestroy {
  private _subHints: Subscription;
  private installed = false;
  @Output() switchTab = new EventEmitter<{
    error?: string;
    next?: InstallPageTabType;
  }>();

  installForm = new FormGroup({
    fname: new FormControl('', {
      validators: formFields.fname.validators,
      updateOn: 'change'
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

  constructor(private apiService: ApiService) {
    this._subHints = this.hints.subscribe(this.installForm, [
      'fname',
      'email',
      'company'
    ]);
    this.apiService.get<PlatformConfig>('/platform/config').subscribe((doc) => {
      if (doc.contact) {
        this.installForm.setValue({
          company: doc.contact.company,
          email: doc.contact.email,
          fname: doc.contact.name
        });
        this.installed = true;
      }
    });
  }

  ngOnDestroy() {
    this._subHints.unsubscribe();
  }

  submitContactInfo(model: Partial<FormContent>) {
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
        this.switchTab.emit({ next: 'telemetry' });
      },
      error: (err: HttpErrorResponse) => {
        const error = this.apiService.extractError(err, [
          [401, 'invalid login credentials', 'Incorrect username or password.']
        ]);
        this.switchTab.emit({ error });
      }
    });
  }
}
