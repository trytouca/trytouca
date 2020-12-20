/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { AuthService } from 'src/app/core/services';
import { ELocalStorageKey } from 'src/app/core/models/frontendtypes';

@Component({
  selector: 'app-header-outside',
  templateUrl: './header-outside.component.html',
  styleUrls: ['./header-outside.component.scss']
})
export class HeaderOutsideComponent {

  /**
   *
   */
  constructor(
    private authService: AuthService
  ) {
  }

  /**
   *
   */
  public isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  /**
   *
   */
  homeLink(): string {
    const lastTeamVisited = localStorage.getItem(ELocalStorageKey.LastVisitedTeam);
    if (lastTeamVisited) {
      return [ '/~', lastTeamVisited ].join('/');
    }
    return '/~';
  }

}
