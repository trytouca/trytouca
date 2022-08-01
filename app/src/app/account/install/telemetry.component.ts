// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

import {
  ELocalStorageKey,
  InstallPageTabType
} from '@/core/models/frontendtypes';
import { ApiService } from '@/core/services';
import { Checkbox } from '@/shared/components/checkbox.component';

@Component({
  selector: 'app-account-install-telemetry',
  templateUrl: './telemetry.component.html'
})
export class InstallTelemetryComponent {
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

  @Output() switchTab = new EventEmitter<{
    error?: string;
    next?: InstallPageTabType;
  }>();

  constructor(private apiService: ApiService, private router: Router) {}

  toggleFeatureFlag(flag: Checkbox) {
    this.telemetry = flag.value;
  }

  submitTelemetry() {
    this.apiService
      .patch('/platform/config', { telemetry: !!this.telemetry })
      .subscribe({
        next: (doc: { url?: string }) => {
          this.apiService._status = undefined;
          this.switchTab.emit({ next: 'thanks' });
          if (doc?.url) {
            localStorage.setItem(ELocalStorageKey.ActivationKey, doc.url);
          }
        },
        error: (err: HttpErrorResponse) => {
          const error = this.apiService.extractError(err, []);
          this.switchTab.emit({ error });
        }
      });
  }
}
