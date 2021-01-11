/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faUser, faUserEdit, faUserMinus, faUserNinja, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { TeamMember, ETeamRole } from '@weasel/core/models/commontypes';

type Icon = {
  type: string;
};

type Topic = string;

@Component({
  selector: 'app-team-item-member',
  templateUrl: './member.component.html',
  styleUrls: ['./row.component.scss']
})
export class TeamItemMemberComponent {

  data: TeamMember;
  icon: Icon;
  topics: Topic[];
  ETeamRole = ETeamRole;

  @Input()
  set item(item: TeamMember) {
    this.data = item;
    this.icon = this.initIcon();
  }
  @Input() isSelf: boolean;
  @Input() isTeamAdmin: boolean;
  @Output() confirmEdit = new EventEmitter<TeamMember>();
  @Output() confirmRemove = new EventEmitter<TeamMember>();

  /**
   *
   */
  constructor(
    private faIconLibrary: FaIconLibrary,
  ) {
    faIconLibrary.addIcons(faUser, faUserEdit, faUserNinja, faUserMinus, faUserTie);
  }

  /**
   *
   */
  private initIcon(): Icon {
    switch (this.data.role) {
      case ETeamRole.Owner:
        return { type: 'user-tie' };
      case ETeamRole.Admin:
        return { type: 'user-ninja' };
      case ETeamRole.Member:
        return { type: 'user' };
    }
  }

  /**
   *
   */
  public edit(): void {
    this.confirmEdit.emit(this.data);
  }

  /**
   *
   */
  public remove(): void {
    this.confirmRemove.emit(this.data);
  }

}
