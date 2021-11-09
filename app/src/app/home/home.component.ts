// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import {
  AlertKind,
  AlertService,
  AuthService,
  ServiceAlert,
  UserService
} from '@/core/services';

@Component({
  selector: 'app-page-home',
  templateUrl: './home.component.html'
})
export class HomeComponent {
  // application-wide alerts that should be shown on top of every page.
  alerts: ServiceAlert[] = [];
  isApiConnectionDown = false;

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
            this.router.navigate(['/account/signin'], {
              queryParams: { e: '401' }
            });
          });
        });
      }
      this.isApiConnectionDown = v.some(
        (k) => k.kind === AlertKind.ApiConnectionDown
      );
      this.alerts = v.filter((k) => k.text);
    });
    this.userService.populate();
  }
}
