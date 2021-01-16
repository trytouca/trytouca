/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DialogService, DialogRef } from '@ngneat/dialog';
import { Subscription } from 'rxjs';
import { PageComponent, PageTab } from '@weasel/home/components';
import { TeamsCreateTeamComponent } from './create.component';
import { TeamsPageTeam } from './teams.model';
import { TeamsPageService } from './teams.service';

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

  TabType = TabType;

  private _dialogRef: DialogRef;
  private _dialogSub: Subscription;

  /**
   *
   */
  constructor(
    private dialogService: DialogService,
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
    if (this._dialogSub) {
      this._dialogSub.unsubscribe();
    }
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
    this._dialogRef = this.dialogService.open(TeamsCreateTeamComponent, { 
      closeButton: false,
      minHeight: '10vh'
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe((state: boolean) => {
      if (state) {
        this.fetchItems();
      }
    });
  }

  /**
   *
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing key 'Escape' should hide "New Team" modal
    if ('Escape' === event.key) {
      if (this._dialogRef && !this._dialogSub.closed) {
        this._dialogRef.close()
      }
    }
  }

}
