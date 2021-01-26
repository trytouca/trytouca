/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import type { UserLookupResponse } from '@weasel/core/models/commontypes';
import {
  AlertService,
  AuthService,
  UserService,
  AlertKind,
  ServiceAlert
} from '@weasel/core/services';

@Component({
  selector: 'app-page-home',
  templateUrl: './home.component.html'
})
export class HomeComponent {
  // application-wide alerts that should be shown on top of every page.
  alerts: ServiceAlert[] = [];
  isApiConnectionDown = false;
  public currentUser: UserLookupResponse;

  /**
   *
   */
  constructor(
    private alertService: AlertService,
    private authService: AuthService,
    private router: Router,
    private userService: UserService
  ) {
    this.alertService.alerts$.subscribe((v) => {
      if (v.some((k) => k.kind === AlertKind.InvalidAuthToken)) {
        timer(2000).subscribe(() => {
          this.authService.logout().subscribe(() => {
            this.alertService.reset();
            this.userService.reset();
            this.router.navigate(['signin'], { queryParams: { e: '401' } });
          });
        });
      }
      this.isApiConnectionDown = v.some(
        (k) => k.kind === AlertKind.ApiConnectionDown
      );
      this.alerts = v.filter((k) => k.text);
    });
    this.userService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user.isVerified) {
        this.alertService.unset(AlertKind.UserNotVerified);
      } else {
        this.alertService.set(AlertKind.UserNotVerified);
      }
    });
    this.userService.populate();
  }
}
