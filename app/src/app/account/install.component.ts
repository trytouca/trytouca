// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';

import { InstallPageTabType } from '@/core/models/frontendtypes';
import { Alert, AlertType } from '@/shared/components/alert.component';

@Component({
  selector: 'app-account-install',
  templateUrl: './install.component.html'
})
export class InstallComponent {
  alert: Alert;
  tabType: InstallPageTabType = 'userInfo';

  switchTab(result: { error?: string; next?: InstallPageTabType }) {
    if (result.error) {
      this.alert = { text: result.error, type: AlertType.Danger };
    } else {
      this.tabType = result.next;
    }
  }
}
