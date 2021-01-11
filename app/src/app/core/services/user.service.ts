/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import type { UserLookupResponse } from '@weasel/core/models/commontypes';
import { errorLogger } from '@weasel/shared/utils/errorLogger';
import { AlertService, AlertKind } from './alert.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public currentUser: UserLookupResponse;
  private subject = new Subject<UserLookupResponse>();
  public currentUser$ = this.subject.asObservable();

  /**
   *
   */
  constructor(
    private alertService: AlertService,
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  /**
   *
   */
  populate(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }
    if (this.currentUser) {
      this.subject.next(this.currentUser);
      return;
    }
    this.apiService.get<UserLookupResponse>('user').subscribe(
      doc => {
        this.alertService.unset(
          AlertKind.ApiConnectionDown,
          AlertKind.ApiConnectionLost
        );
        this.currentUser = doc;
        this.subject.next(doc);
      },
      err => {
        if (err.status === 0) {
          this.alertService.set(!this.currentUser ? AlertKind.ApiConnectionDown : AlertKind.ApiConnectionLost);
        } else if (err.status === 401) {
          this.alertService.set(AlertKind.InvalidAuthToken);
        } else {
          errorLogger.notify(err);
        }
      }
    );
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

}
