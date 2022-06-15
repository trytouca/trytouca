// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { timer } from 'rxjs';

import { ApiService } from '@/core/services';
import { Checkbox } from '@/shared/components/checkbox.component';

@Component({
  selector: 'app-settings-tab-telemetry',
  templateUrl: './telemetry.component.html',
  styles: []
})
export class TelemetryComponent {
  private _preferences: Checkbox[] = [
    {
      default: true,
      description: 'Anonymized daily usage statistics',
      experimental: false,
      saved: false,
      slug: 'aggregate-usage',
      title: 'Aggregate Usage Data',
      visible: true
    }
  ];

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
