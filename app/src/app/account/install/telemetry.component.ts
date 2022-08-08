// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';

import {
  ELocalStorageKey,
  InstallPageTabType
} from '@/core/models/frontendtypes';
import { ApiService } from '@/core/services';

@Component({
  selector: 'app-account-install-telemetry',
  templateUrl: './telemetry.component.html'
})
export class InstallTelemetryComponent {
  sample_data = `{
  "createdAt": "2022-08-08T15:29:24.325Z",
  "messages_new": 5814,
  "node_id": "a7cea1d8-851a-4e2a-b20b-a98a68dab943",
  "reports_new": 7,
  "runtime_new": 657,
  "sessions_new": 14,
  "users_active": 2,
  "versions_new": 6
}`;

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
