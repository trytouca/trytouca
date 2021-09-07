// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { map } from 'rxjs/operators';

import { EPlatformRole, UserLookupResponse } from '../models/commontypes';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate, CanActivateChild {
  /**
   *
   */
  constructor(private apiService: ApiService, private router: Router) {}

  /**
   *
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const roles = [EPlatformRole.Admin, EPlatformRole.Owner];
    return this.apiService.get<UserLookupResponse>('/user').pipe(
      map((v) => {
        if (roles.includes(v.platformRole)) {
          return true;
        }
        return this.router.parseUrl('/account');
      })
    );
  }

  /**
   *
   */
  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.canActivate(route, state);
  }
}
