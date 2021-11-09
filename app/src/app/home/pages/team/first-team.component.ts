// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy } from '@angular/core';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { Subscription } from 'rxjs';

import { TeamCreateTeamComponent } from './create-team.component';
import { TeamPageService } from './team.service';

@Component({
  selector: 'app-team-first-team',
  templateUrl: './first-team.component.html',
  styles: ['img { margin: 5vh auto; }']
})
export class TeamFirstTeamComponent implements OnDestroy {
  private _dialogRef: DialogRef;
  private _dialogSub: Subscription;

  constructor(
    private dialogService: DialogService,
    private teamPageService: TeamPageService
  ) {}

  ngOnDestroy() {
    if (this._dialogSub) {
      this._dialogSub.unsubscribe();
    }
  }

  openCreateModal() {
    this._dialogRef = this.dialogService.open(TeamCreateTeamComponent, {
      closeButton: false,
      minHeight: '10vh'
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe((state) => {
      if (state) {
        const teamSlug = state.action === 'create' ? state.slug : null;
        this.teamPageService.refreshTeams(teamSlug);
      }
    });
  }
}
