// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class InstallGuard implements CanActivate, CanActivateChild {
  constructor(private apiService: ApiService, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.apiService.status().pipe(
      map((v) => {
        if (v.configured) {
          return this.router.parseUrl('/account/signin');
        }
        return true;
      })
    );
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.canActivate(route, state);
  }
}
