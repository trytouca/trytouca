// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';

import { UserSessionsResponseItem } from '@/core/models/commontypes';

@Component({
  selector: 'app-settings-tab-sessions',
  templateUrl: './sessions.component.html'
})
export class SettingsTabSessionsComponent {
  @Input() sessions: UserSessionsResponseItem[];
  @Output() remove = new EventEmitter<string>();
}
