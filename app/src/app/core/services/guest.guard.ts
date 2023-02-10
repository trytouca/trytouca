// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { map } from 'rxjs';

import { ELocalStorageKey } from '../models/frontendtypes';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate, CanActivateChild {
  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.apiService.status().pipe(
      map((response) => {
        if (!response.configured) {
          return this.router.parseUrl('/account/install');
        }
        if (this.authService.isLoggedIn()) {
          if (route.queryParamMap.has('t')) {
            localStorage.setItem(
              ELocalStorageKey.CLIToken,
              route.queryParamMap.get('t')
            );
          }
          this.authService.redirectUrl = state.url;
          return this.router.parseUrl('/~');
        }
        return true;
      })
    );
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.canActivate(route, state);
  }
}
