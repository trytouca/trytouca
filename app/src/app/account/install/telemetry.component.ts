// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Output } from '@angular/core';

import { InstallPageTabType } from '@/core/models/frontendtypes';

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

  proceed() {
    this.switchTab.emit({ next: 'thanks' });
  }
}
