// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, Input } from '@angular/core';
import { PlatformStatsResponse } from '@touca/api-schema';

@Component({
  selector: 'app-settings-tab-server',
  templateUrl: './server.component.html'
})
export class SettingsTabServerComponent {
  @Input() stats: Omit<PlatformStatsResponse, 'users'>;
}
