// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';

import { ELocalStorageKey } from '@/core/models/frontendtypes';
import { AuthService } from '@/core/services';
import { intercomClient } from '@/shared/utils/intercom';

@Component({
  selector: 'app-header-outside',
  templateUrl: './header-outside.component.html',
  styleUrls: ['./header.components.scss']
})
export class HeaderOutsideComponent {
  /**
   *
   */
  constructor(private authService: AuthService) {
    intercomClient.boot();
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
    const teamSlug = localStorage.getItem(ELocalStorageKey.LastVisitedTeam);
    return teamSlug ? ['/~', teamSlug].join('/') : '/~';
  }
}
