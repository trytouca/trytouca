// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import type { UserLookupResponse } from '@touca/api-schema';
import { AuthService, UserService } from '@/core/services';
import { intercomClient } from '@/shared/utils/intercom';

@Component({
  selector: 'app-header-inside',
  templateUrl: './header-inside.component.html'
})
export class HeaderInsideComponent implements AfterContentInit, OnDestroy {
  currentUser: UserLookupResponse;
  private _subUser: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService
  ) {
    this._subUser = this.userService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      intercomClient.setUser(user);
    });
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
}
