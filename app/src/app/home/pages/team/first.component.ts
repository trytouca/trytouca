/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TeamCreateSuiteComponent } from './create.component';
import { TeamPageService, TeamPageTabType } from './team.service';

@Component({
  selector: 'app-team-first-suite',
  templateUrl: './first.component.html'
})
export class TeamFirstSuiteComponent {

  /**
   *
   */
  constructor(
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private teamPageService: TeamPageService
  ) {
  }

  /**
   *
   */
  fetchItems(): void {
    const paramMap = this.route.snapshot.paramMap;
    const teamSlug = paramMap.get('team');
    this.teamPageService.fetchItems({ currentTab: TeamPageTabType.Suites, teamSlug });
  }

  /**
   *
   */
  openCreateModal() {
    const paramMap = this.route.snapshot.paramMap;
    const teamSlug = paramMap.get('team');

    const modalRef = this.modalService.open(TeamCreateSuiteComponent);
    modalRef.componentInstance.teamSlug = teamSlug;
    modalRef.result
      .then((state: boolean) => {
        if (state) {
          this.fetchItems();
        }
      })
      .catch(_e => true);
  }

}
