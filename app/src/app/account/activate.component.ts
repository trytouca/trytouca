/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { timer, Subscription } from 'rxjs';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ApiService, AuthService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';

@Component({
  selector: 'wsl-account-activate',
  templateUrl: './activate.component.html'
})
export class ActivateComponent implements OnDestroy {
  alert: Alert;
  private _sub: Partial<Record<'activate' | 'timer', Subscription>> = {};

  /**
   *
   */
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
    this._sub.activate = apiService.post(`/auth/activate/${key}`).subscribe(
      (doc) => {
        localStorage.setItem(ELocalStorageKey.TokenExpiresAt, doc.expiresAt);
        router.navigate(['/account/welcome']);
      },
      (err) => {
        const error = apiService.extractError(err, [
          [400, 'invalid activation key', 'This activation key is invalid.'],
          [404, 'activation key not found', 'This activation key has expired.']
        ]);
        this.alert = { type: AlertType.Danger, text: error };
        this._sub.timer = timer(3000).subscribe(() => {
          router.navigate(['/account']);
        });
      }
    );
  }

  /**
   *
   */
  ngOnDestroy() {
    Object.values(this._sub).forEach((s) => s.unsubscribe());
  }
}
