/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';
import { AuthService } from '@weasel/core/services';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';

@Component({
  selector: 'app-header-outside',
  templateUrl: './header-outside.component.html',
  styleUrls: ['./header.components.scss']
})
export class HeaderOutsideComponent {
  /**
   *
   */
  @Input() dark = false;
  @Input() sticky = false;

  /**
   *
   */
  constructor(private authService: AuthService) {}

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
    const lastTeamVisited = localStorage.getItem(
      ELocalStorageKey.LastVisitedTeam
    );
    if (lastTeamVisited) {
      return ['/~', lastTeamVisited].join('/');
    }
    return '/~';
  }
}
