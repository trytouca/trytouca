/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {
  /**
   *
   */
  constructor(private authService: AuthService, private router: Router) {}

  /**
   *
   */
  canActivate(): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/account']);
      return false;
    }
    return true;
  }
}
