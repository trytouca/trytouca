// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faUser,
  faUserEdit,
  faUserMinus,
  faUserNinja,
  faUserTie
} from '@fortawesome/free-solid-svg-icons';

import { ETeamRole, TeamMember } from '@/core/models/commontypes';

type Icon = {
  type: IconProp;
};

type Topic = string;

@Component({
  selector: 'app-team-item-member',
  templateUrl: './member.component.html',
  styleUrls: ['../../styles/item.component.scss']
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
  constructor(faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIcons(
      faUser,
      faUserEdit,
      faUserNinja,
      faUserMinus,
      faUserTie
    );
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
