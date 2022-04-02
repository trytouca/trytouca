// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { formatDistanceToNow } from 'date-fns/esm';

export interface RecentEvent {
  copyLink?: string;
  copyText: string;
  email: string;
  eventDate: Date;
  expiresAt?: Date;
  fullname: string;
  username: string;
}

@Component({
  selector: 'app-settings-tab-audit',
  templateUrl: './audit.component.html'
})
export class SettingsTabAuditComponent {
  @Input() events: RecentEvent[];
  @Output() copyToClipboard = new EventEmitter<string>();

  describeEventDate(eventDate: Date) {
    return formatDistanceToNow(eventDate, { addSuffix: true });
  }
}
