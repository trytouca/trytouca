// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faUser, faUserPlus } from '@fortawesome/free-solid-svg-icons';

import { TeamApplicant } from '@touca/api-schema';

@Component({
  selector: 'app-team-item-applicant',
  templateUrl: './applicant.component.html'
})
export class TeamItemApplicantComponent {
  @Input() item: TeamApplicant;
  @Input() isTeamAdmin: boolean;
  @Output() confirmAccept = new EventEmitter<TeamApplicant>();
  @Output() confirmDecline = new EventEmitter<TeamApplicant>();

  constructor(private faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIcons(faUser, faUserPlus);
  }

  accept(): void {
    this.confirmAccept.emit(this.item);
  }

  decline(): void {
    this.confirmDecline.emit(this.item);
  }
}
