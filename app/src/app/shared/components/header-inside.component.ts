// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faChevronDown,
  faInbox,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

import type { UserLookupResponse } from '@/core/models/commontypes';
import { EPlatformRole } from '@/core/models/commontypes';
import { AuthService, UserService } from '@/core/services';
import { intercomClient } from '@/shared/utils/intercom';

@Component({
  selector: 'app-header-inside',
  templateUrl: './header-inside.component.html',
  styleUrls: ['./header.components.scss']
})
export class HeaderInsideComponent implements AfterContentInit, OnDestroy {
  currentUser: UserLookupResponse;
  private _subUser: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    faIconLibrary: FaIconLibrary
  ) {
    this._subUser = this.userService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      intercomClient.boot(user);
    });
    faIconLibrary.addIcons(faChevronDown, faInbox, faUser);
  }

  ngAfterContentInit() {
    this.currentUser = this.userService.currentUser;
  }

  ngOnDestroy() {
    this._subUser.unsubscribe();
  }

  public isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  public logout() {
    return this.authService.logout().subscribe(() => {
      this.userService.reset();
      this.router.navigate(['/account/signin']);
    });
  }

  get isPlatformAdmin() {
    return [EPlatformRole.Owner, EPlatformRole.Admin].includes(
      this.currentUser?.platformRole
    );
  }
}
