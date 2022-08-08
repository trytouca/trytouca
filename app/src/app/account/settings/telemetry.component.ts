// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { timer } from 'rxjs';

import { ApiService } from '@/core/services';
import { Checkbox } from '@/shared/components/checkbox.component';

export const telemetry_sample_data = {
  created_at: '2022-08-08T15:29:24.325Z',
  messages_new: 5814,
  node_id: 'a7cea1d8-851a-4e2a-b20b-a98a68dab943',
  reports_new: 7,
  runtime_new: 657,
  sessions_new: 14,
  users_active: 2,
  versions_new: 6
};

@Component({
  selector: 'app-settings-tab-telemetry',
  templateUrl: './telemetry.component.html',
  styles: []
})
export class TelemetryComponent {
  private _preferences: Checkbox[] = [
    {
      default: true,
      description:
        'Touca is open source software. You may disable this feature if you need to.',
      experimental: false,
      saved: false,
      slug: 'aggregate-usage',
      title: 'Collect Aggregate Usage Data',
      visible: true
    }
  ];
  sample_data = JSON.stringify(telemetry_sample_data, null, 2);

  constructor(private apiService: ApiService) {}

  toggleCheckbox(flag: Checkbox) {
    const node = this._preferences.find((v) => v.slug === flag.slug);
    node.value = !(node.value ?? false);
    this.apiService
      .patch('/platform/config', { telemetry: node.value })
      .subscribe({
        next: () => {
          node.saved = true;
          timer(3000).subscribe(() => (node.saved = false));
        }
      });
  }

  getTelemetryPreferences(): Checkbox[] {
    return this._preferences;
  }
}
