// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { PlatformStatsUser, UserLookupResponse } from '@touca/api-schema';

@Component({
  selector: 'app-settings-tab-users',
  templateUrl: './users.component.html'
})
export class SettingsTabUsersComponent {
  @Input() accounts: PlatformStatsUser[];
  @Input() user: UserLookupResponse;
  @Output() copyToClipboard = new EventEmitter<string>();
  @Output() updateAccount = new EventEmitter<{
    message: string;
    url: string;
  }>();

  suspendAccount(user: PlatformStatsUser) {
    this.updateAccount.emit({
      url: `/platform/account/${user.username}/suspend`,
      message: `Account for ${user.fullname ?? user.email} was suspended.`
    });
  }

  deleteAccount(user: PlatformStatsUser) {
    this.updateAccount.emit({
      url: `/platform/account/${user.username}/delete`,
      message: `Account for ${user.fullname ?? user.email} was deleted.`
    });
  }
}
