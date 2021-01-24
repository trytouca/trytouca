/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   *
   */
  constructor(private apiService: ApiService) {}

  /**
   *
   */
  public login(username: string, password: string) {
    return this.apiService.post('auth/signin', { username, password }).pipe(
      map((doc) => {
        localStorage.setItem(ELocalStorageKey.TokenExpiresAt, doc.expiresAt);
      })
    );
  }

  /**
   *
   */
  public logout() {
    return this.apiService.post('auth/signout').pipe(
      catchError((err) => {
        return of([]);
      }),
      finalize(() => {
        localStorage.removeItem(ELocalStorageKey.Callback);
        localStorage.removeItem(ELocalStorageKey.LastVisitedTeam);
        localStorage.removeItem(ELocalStorageKey.TokenExpiresAt);
      })
    );
  }

  /**
   *
   */
  public isLoggedIn() {
    const expiresAt = localStorage.getItem(ELocalStorageKey.TokenExpiresAt);
    return expiresAt && new Date() < new Date(expiresAt);
  }
}
