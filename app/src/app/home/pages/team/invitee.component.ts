// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import { TeamInvitee } from '@touca/api-schema';

@Component({
  selector: 'app-team-item-invitee',
  templateUrl: './invitee.component.html'
})
export class TeamItemInviteeComponent {
  @Input() item: TeamInvitee;
  @Input() isTeamAdmin: boolean;
  @Output() confirmRescind = new EventEmitter<TeamInvitee>();

  constructor(private faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIcons(faUser);
  }

  rescind(): void {
    this.confirmRescind.emit(this.item);
  }
}
