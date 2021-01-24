/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faChevronDown,
  faInbox,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import type { UserLookupResponse } from '@weasel/core/models/commontypes';
import { EPlatformRole } from '@weasel/core/models/commontypes';
import { AuthService, UserService } from '@weasel/core/services';

@Component({
  selector: 'app-header-inside',
  templateUrl: './header-inside.component.html'
})
export class HeaderInsideComponent implements AfterContentInit, OnDestroy {
  currentUser: UserLookupResponse;
  private _subUser: Subscription;

  /**
   *
   */
  constructor(
    private authService: AuthService,
    private faIconLibrary: FaIconLibrary,
    private router: Router,
    private userService: UserService
  ) {
    this._subUser = this.userService.currentUser$.subscribe(
      (user) => (this.currentUser = user)
    );
    faIconLibrary.addIcons(faChevronDown, faInbox, faUser);
  }

  ngAfterContentInit() {
    this.currentUser = this.userService.currentUser;
  }

  ngOnDestroy() {
    this._subUser.unsubscribe();
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
  public logout() {
    return this.authService.logout().subscribe(() => {
      this.userService.reset();
      this.router.navigate(['/']);
    });
  }

  /**
   *
   */
  get isPlatformAdmin() {
    return [EPlatformRole.Owner, EPlatformRole.Admin].includes(
      this.currentUser?.platformRole
    );
  }
}
