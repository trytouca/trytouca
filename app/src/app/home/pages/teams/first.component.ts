/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TeamsPageService } from './teams.service';
import { TeamsCreateTeamComponent } from './create.component';

@Component({
  selector: 'app-teams-first',
  templateUrl: './first.component.html',
  styles: ['img { margin: 5vh auto; }']
})
export class TeamsFirstTeamComponent {

  /**
   *
   */
  constructor(
    private modalService: NgbModal,
    private teamsPageService: TeamsPageService
  ) {
  }

  /**
   *
   */
  fetchItems(): void {
    this.teamsPageService.fetchItems({});
  }

  /**
   *
   */
  openCreateModal() {
    const modalRef = this.modalService.open(TeamsCreateTeamComponent);
    modalRef.result
      .then((state: boolean) => {
        if (state) {
          this.fetchItems();
        }
      })
      .catch(_e => true);
  }

}
