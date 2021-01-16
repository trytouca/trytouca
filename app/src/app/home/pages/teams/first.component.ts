/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { DialogService, DialogRef } from '@ngneat/dialog';
import { Subscription } from 'rxjs';
import { TeamsPageService } from './teams.service';
import { TeamsCreateTeamComponent } from './create.component';

@Component({
  selector: 'app-teams-first',
  templateUrl: './first.component.html',
  styles: ['img { margin: 5vh auto; }']
})
export class TeamsFirstTeamComponent implements OnDestroy {

  private _dialogRef: DialogRef;
  private _dialogSub: Subscription;

  /**
   *
   */
  constructor(
    private dialogService: DialogService,
    private teamsPageService: TeamsPageService
  ) {
  }

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
    this.teamsPageService.fetchItems({});
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

}
