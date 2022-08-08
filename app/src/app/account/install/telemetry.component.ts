// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';

import {
  ELocalStorageKey,
  InstallPageTabType
} from '@/core/models/frontendtypes';
import { ApiService } from '@/core/services';

import { telemetry_sample_data } from '../settings/telemetry.component';

@Component({
  selector: 'app-account-install-telemetry',
  templateUrl: './telemetry.component.html'
})
export class InstallTelemetryComponent {
  sample_data = JSON.stringify(telemetry_sample_data, null, 2);

  @Output() switchTab = new EventEmitter<{
    error?: string;
    next?: InstallPageTabType;
  }>();

  constructor(private apiService: ApiService) {}

  proceed() {
    this.apiService.patch('/platform/config', { telemetry: true }).subscribe({
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
