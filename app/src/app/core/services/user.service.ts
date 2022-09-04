// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { ETeamRole, UserLookupResponse } from '@touca/api-schema';
import { Observable, Subject } from 'rxjs';

import { errorLogger } from '@/shared/utils/errorLogger';

import { AlertKind, AlertService } from './alert.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public currentUser: UserLookupResponse;
  private subject = new Subject<UserLookupResponse>();
  public currentUser$ = this.subject.asObservable();

  constructor(
    private alertService: AlertService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  populate(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }
    if (this.currentUser) {
      this.subject.next(this.currentUser);
      return;
    }
    this.apiService.get<UserLookupResponse>('/user').subscribe({
      next: (doc) => {
        this.alertService.unset(
          AlertKind.ApiConnectionDown,
          AlertKind.ApiConnectionLost
        );
        this.currentUser = doc;
        this.subject.next(doc);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.alertService.set(
            !this.currentUser
              ? AlertKind.ApiConnectionDown
              : AlertKind.ApiConnectionLost
          );
        } else if (err.status === 401) {
          this.alertService.set(AlertKind.InvalidAuthToken);
        } else {
          errorLogger.notify(err);
        }
      }
    });
  }

  isTeamAdmin(role: ETeamRole): boolean {
    if (this.currentUser) {
      const role = this.currentUser.platformRole;
      if (role === 'owner' || role === 'admin') {
        return true;
      }
    }
    if (role === 'owner' || role === 'admin') {
      return true;
    }
    return false;
  }

  /**
   * Removes stored information about the current user.
   *
   * Intended to ba called when user signs out, either because they chose to
   * or because their API Token had expired. Because this service is shared
   * between all modules, resetting the service is the only way we can ensure
   * correct behavior if user signs back in with another account.
   */
  reset(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }
    this.currentUser = undefined;
  }

  updateFeatureFlag(slug: string, value: boolean): Observable<void> {
    if (value) {
      this.currentUser.feature_flags.push(slug);
    } else {
      const index = this.currentUser.feature_flags.indexOf(slug);
      this.currentUser.feature_flags.splice(index, 1);
    }
    this.subject.next(this.currentUser);
    return this.apiService.patch('/user', { flags: { [slug]: value } });
  }

  updateApiKey(key: string): void {
    this.apiService.patch('/user', { key }).subscribe({
      next: (doc) => {
        this.currentUser.apiKeys = doc.apiKeys;
        this.subject.next(this.currentUser);
      }
    });
  }
}
