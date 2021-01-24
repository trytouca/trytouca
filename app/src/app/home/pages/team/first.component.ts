/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DialogService, DialogRef } from '@ngneat/dialog';
import { Subscription } from 'rxjs';
import { TeamCreateSuiteComponent } from './create.component';
import { TeamPageService, TeamPageTabType } from './team.service';

@Component({
  selector: 'app-team-first-suite',
  templateUrl: './first.component.html'
})
export class TeamFirstSuiteComponent implements OnDestroy {
  private _dialogRef: DialogRef;
  private _dialogSub: Subscription;

  /**
   *
   */
  constructor(
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private teamPageService: TeamPageService
  ) {}

  /**
   *
   */
  ngOnDestroy() {
    if (this._dialogSub) {
      this._dialogSub.unsubscribe();
    }
  }

  /**
   *
   */
  fetchItems(): void {
    const paramMap = this.route.snapshot.paramMap;
    const teamSlug = paramMap.get('team');
    this.teamPageService.fetchItems({
      currentTab: TeamPageTabType.Suites,
      teamSlug
    });
  }

  /**
   *
   */
  openCreateModal() {
    const paramMap = this.route.snapshot.paramMap;
    this._dialogRef = this.dialogService.open(TeamCreateSuiteComponent, {
      data: {
        teamSlug: paramMap.get('team')
      }
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (state) {
          this.fetchItems();
        }
      }
    );
  }
}
