// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable, NgZone } from '@angular/core';
import { bindCallback, from, Observable, of } from 'rxjs';
import { catchError, finalize, map, mergeMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { ELocalStorageKey } from '@/core/models/frontendtypes';

import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // the URL to redirect to after user logs in
  redirectUrl: string;
  private authInstance: gapi.auth2.GoogleAuth;

  constructor(private apiService: ApiService, private zone: NgZone) {}

  public login(username: string, password: string) {
    return this.apiService.post('auth/signin', { username, password }).pipe(
      map((doc: { expiresAt: string }) => {
        localStorage.setItem(ELocalStorageKey.TokenExpiresAt, doc.expiresAt);
      })
    );
  }

  public logout() {
    return this.apiService.post('auth/signout').pipe(
      catchError(() => {
        return of([]);
      }),
      finalize(() => {
        localStorage.removeItem(ELocalStorageKey.LastVisitedTeam);
        localStorage.removeItem(ELocalStorageKey.TokenExpiresAt);
        this.authInstance?.signOut();
      })
    );
  }

  public isLoggedIn() {
    const expiresAt = localStorage.getItem(ELocalStorageKey.TokenExpiresAt);
    return expiresAt && new Date() < new Date(expiresAt);
  }

  private google_initialize(): Observable<gapi.auth2.GoogleAuthBase> {
    if (this.authInstance !== undefined) {
      return of(this.authInstance);
    }
    const config: gapi.auth2.ClientConfig = {
      client_id: environment.google_api_client_id,
      scope: 'profile email',
      cookie_policy: 'single_host_origin'
    };
    return bindCallback(gapi.load)('auth2').pipe(
      mergeMap(() => from(gapi.auth2.init(config)))
    );
  }

  private google_authenticate(): Observable<gapi.auth2.GoogleUser> {
    if (this.authInstance !== undefined && this.authInstance.isSignedIn) {
      return of(this.authInstance.currentUser.get());
    }
    if (this.authInstance !== undefined) {
      return from(this.authInstance.signIn());
    }
    return this.google_initialize().pipe(mergeMap((auth) => auth.signIn()));
  }

  google_login(): Observable<void> {
    const set_expiration_date = (doc: { expiresAt: string }) => {
      localStorage.setItem(ELocalStorageKey.TokenExpiresAt, doc.expiresAt);
    };
    return this.google_authenticate().pipe(
      mergeMap((user) => {
        const google_token = user.getAuthResponse().id_token;
        return this.apiService
          .post('auth/signin/google', { google_token })
          .pipe(map(set_expiration_date));
      })
    );
  }
}
