/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TeamsPageService } from './teams.service';
import { TeamsCreateTeamComponent } from './create.component';
import { PageComponent, PageTab } from '@weasel/home/components';
import { TeamsPageTeam } from './teams.model';

enum TabType {
  Teams = 'teams'
}

const pageTabs: PageTab<TabType>[] = [
  {
    type: TabType.Teams,
    name: 'Teams',
    link: 'teams',
    icon: 'users',
    shown: true
  },
];

type NotFound = Partial<{}>;

@Component({
  selector: 'app-teams-page',
  templateUrl: './page.component.html',
  providers: [ TeamsPageService, { provide: 'PAGE_TABS', useValue: pageTabs } ]
})
export class TeamsPageComponent extends PageComponent<TeamsPageTeam, TabType, NotFound> implements OnInit, OnDestroy {

  private _modalRef: NgbModalRef;
  TabType = TabType;

  /**
   *
   */
  constructor(
    private modalService: NgbModal,
    private teamsPageService: TeamsPageService,
    route: ActivatedRoute
  ) {
    super(teamsPageService, pageTabs, route);
  }

  /**
   *
   */
  ngOnInit() {
    super.ngOnInit();
  }

  /**
   *
   */
  ngOnDestroy() {
    super.ngOnDestroy();
  }

  /**
   *
   */
  fetchItems(): void {
    this.pageService.fetchItems();
  }

  /**
   *
   */
  openCreateModal() {
    this._modalRef = this.modalService.open(TeamsCreateTeamComponent);
    this._modalRef.result
      .then((state: boolean) => {
        if (state) {
          this.fetchItems();
        }
      })
      .catch(_e => true);
  }

  /**
   *
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing key 'Escape' should hide "New Team" modal
    if ('Escape' === event.key) {
      if (this.modalService.hasOpenModals()) {
        this._modalRef.close();
      }
    }
  }

}
