// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Subscription, timer } from 'rxjs';

import { ELocalStorageKey } from '@/core/models/frontendtypes';
import { ApiService, AuthService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';

@Component({
  selector: 'app-account-activate',
  templateUrl: './activate.component.html'
})
export class ActivateComponent implements OnDestroy {
  alert: Alert;
  private _sub: Partial<Record<'activate' | 'timer', Subscription>> = {};

  constructor(
    route: ActivatedRoute,
    router: Router,
    apiService: ApiService,
    authService: AuthService,
    faIconLibrary: FaIconLibrary
  ) {
    faIconLibrary.addIcons(faSpinner);
    if (authService.isLoggedIn() || !route.snapshot.queryParamMap.has('key')) {
      router.navigate(['/account']);
      return;
    }
    const key = route.snapshot.queryParamMap.get('key');
    this._sub.activate = apiService.post(`/auth/activate/${key}`).subscribe({
      next: (doc) => {
        localStorage.setItem(
          ELocalStorageKey.TokenExpiresAt,
          doc.expiresAt as string
        );
        router.navigate(['/account/welcome']);
      },
      error: (err: HttpErrorResponse) => {
        const error = apiService.extractError(err, [
          [400, 'invalid activation key', 'This activation key is invalid.'],
          [404, 'activation key not found', 'This activation key has expired.']
        ]);
        this.alert = { type: AlertType.Danger, text: error };
        this._sub.timer = timer(3000).subscribe(() => {
          router.navigate(['/account']);
        });
      }
    });
  }

  ngOnDestroy() {
    Object.values(this._sub).forEach((s) => s.unsubscribe());
  }
}
