// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';
import { Checkbox } from '@/shared/components/checkbox.component';

enum InstallPageTabType {
  UserInfo = 'userInfo',
  Telemetry = 'telemetry',
  Thanks = 'thanks'
}

@Component({
  selector: 'app-account-install',
  templateUrl: './install.component.html'
})
export class InstallComponent {
  alert: Alert;
  TabType = InstallPageTabType;
  tabType = InstallPageTabType.UserInfo;
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

  constructor(private apiService: ApiService, private router: Router) {
    this.switchTab(InstallPageTabType.UserInfo);
  }

  toggleFeatureFlag(flag: Checkbox) {
    this.telemetry = flag.value;
  }

  submitTelemetry() {
    this.apiService
      .patch('/platform/config', { telemetry: !!this.telemetry })
      .subscribe((doc) => {
        this.tabType = InstallPageTabType.Thanks;
        this.apiService._status = undefined;
        if (doc?.url) {
          this.router.navigate(['/account/activate'], {
            queryParams: { key: doc.url }
          });
        }
      });
  }

  switchTab(tabType: InstallPageTabType) {
    this.tabType = tabType;
  }

  nextTab(result: { error?: string }) {
    if (result?.error) {
      this.alert = { text: result.error, type: AlertType.Danger };
    } else {
      this.switchTab(InstallPageTabType.Telemetry);
    }
  }

  navigateToSignup() {
    this.router.navigate(['/account/signup']);
  }
}
