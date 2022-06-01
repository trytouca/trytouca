// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { Subscription } from 'rxjs';

import { TeamCreateSuiteComponent } from './create-suite.component';
import { TeamPageService } from './team.service';

@Component({
  selector: 'app-team-first-suite',
  templateUrl: './first-suite.component.html'
})
export class TeamFirstSuiteComponent implements OnDestroy {
  private _dialogRef: DialogRef;
  private _dialogSub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private teamPageService: TeamPageService
  ) {}

  ngOnDestroy() {
    if (this._dialogSub) {
      this._dialogSub.unsubscribe();
    }
  }

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
          this.teamPageService.refreshSuites();
        }
      }
    );
  }
}
