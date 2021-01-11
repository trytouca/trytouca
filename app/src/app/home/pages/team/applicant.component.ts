/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faUser, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { TeamApplicant } from '@weasel/core/models/commontypes';

@Component({
  selector: 'app-team-item-applicant',
  templateUrl: './applicant.component.html',
  styleUrls: ['./row.component.scss']
})
export class TeamItemApplicantComponent {

  @Input() item: TeamApplicant;
  @Input() isTeamAdmin: boolean;
  @Output() confirmAccept = new EventEmitter<TeamApplicant>();
  @Output() confirmDecline = new EventEmitter<TeamApplicant>();

  /**
   *
   */
  constructor(
    private faIconLibrary: FaIconLibrary
  ) {
    faIconLibrary.addIcons(faUser, faUserPlus);
  }

  /**
   *
   */
  accept(): void {
    this.confirmAccept.emit(this.item);
  }

  /**
   *
   */
  decline(): void {
    this.confirmDecline.emit(this.item);
  }

}
