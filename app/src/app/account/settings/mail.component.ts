// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PlatformConfig } from '@touca/api-schema';
import { timer } from 'rxjs';

import { ApiService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';

@Component({
  selector: 'app-settings-tab-mail',
  templateUrl: './mail.component.html'
})
export class SettingsTabMailComponent {
  alert: Alert;
  mailSettingsForm = new FormGroup({
    host: new FormControl('', {
      updateOn: 'blur'
    }),
    port: new FormControl<number>(537, {
      updateOn: 'blur'
    }),
    user: new FormControl('', {
      updateOn: 'blur'
    }),
    pass: new FormControl('', {
      updateOn: 'blur'
    })
  });
  view: 'form' | 'panel';

  constructor(private apiService: ApiService) {
    this.apiService.get<PlatformConfig>('/platform/config').subscribe((doc) => {
      const mail = {
        host: doc.mail?.host ?? '',
        pass: doc.mail?.pass ?? '',
        port: doc.mail?.port ?? 537,
        user: doc.mail?.user ?? ''
      };
      this.mailSettingsForm.setValue(mail);
      this.view = doc.mail?.host.length ? 'form' : 'panel';
      if (doc.mail && !doc.mail.configurable) {
        this.mailSettingsForm.disable();
        this.alert = {
          text: 'Mail server is being configured by environment variables.',
          type: AlertType.Info
        };
      }
    });
  }

  onSubmit(model: Partial<PlatformConfig['mail']>) {
    if (!this.mailSettingsForm.valid) {
      return;
    }
    this.apiService.patch('/platform/config', { mail: model }).subscribe({
      next: () => {
        this.alert = {
          text: 'Configuration updated successfully.',
          type: AlertType.Success
        };
        timer(5000).subscribe(() => (this.alert = undefined));
      },
      error: (err: HttpErrorResponse) => {
        const error = this.apiService.extractError(err, []);
        this.alert = { text: error, type: AlertType.Danger };
      }
    });
  }

  resetForm() {
    const model = { host: '', pass: '', port: 537, user: '' };
    this.onSubmit(model);
    this.mailSettingsForm.setValue(model);
  }
}
