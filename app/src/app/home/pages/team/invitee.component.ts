/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import { TeamInvitee } from '@/core/models/commontypes';

@Component({
  selector: 'app-team-item-invitee',
  templateUrl: './invitee.component.html',
  styleUrls: ['../../styles/item.component.scss']
})
export class TeamItemInviteeComponent {
  @Input() item: TeamInvitee;
  @Input() isTeamAdmin: boolean;
  @Output() confirmRescind = new EventEmitter<TeamInvitee>();

  /**
   *
   */
  constructor(private faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIcons(faUser);
  }

  /**
   *
   */
  rescind(): void {
    this.confirmRescind.emit(this.item);
  }
}
