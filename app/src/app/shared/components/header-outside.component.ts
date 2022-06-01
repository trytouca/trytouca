// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';

import { ELocalStorageKey } from '@/core/models/frontendtypes';
import { AuthService } from '@/core/services';

@Component({
  selector: 'app-header-outside',
  templateUrl: './header-outside.component.html'
})
export class HeaderOutsideComponent {
  constructor(private authService: AuthService) {}

  public isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  homeLink(): string {
    const teamSlug = localStorage.getItem(ELocalStorageKey.LastVisitedTeam);
    return teamSlug ? ['/~', teamSlug].join('/') : '/~';
  }
}
