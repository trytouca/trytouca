/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { timer } from 'rxjs';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ApiService, AuthService } from '@weasel/core/services';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';

@Component({
  selector: 'wsl-account-activate',
  templateUrl: './activate.component.html'
})
export class ActivateComponent implements OnInit {
  alert: Alert;

  /**
   *
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    faIconLibrary: FaIconLibrary
  ) {
    faIconLibrary.addIcons(faSpinner);
  }

  /**
   *
   */
  ngOnInit() {
    const queryMap = this.route.snapshot.queryParamMap;
    if (!queryMap.has('key')) {
      this.router.navigate(['/']);
    }
    const key = queryMap.get('key');
    this.apiService.post(`/auth/activate/${key}`).subscribe(
      () => {
        this.alert = {
          type: AlertType.Success,
          text: 'All set. Your account was verified.'
        };
        localStorage.removeItem(ELocalStorageKey.Callback);
        timer(3000).subscribe(() => {
          this.router.navigate([
            this.authService.isLoggedIn() ? '/~' : '/signin'
          ]);
        });
      },
      (err) => {
        const error = this.apiService.extractError(err, [
          [400, 'invalid activation key', 'This activation key is invalid.'],
          [404, 'activation key not found', 'This activation key has expired.']
        ]);
        this.alert = { type: AlertType.Danger, text: error };
        localStorage.removeItem(ELocalStorageKey.Callback);
        timer(3000).subscribe(() => {
          this.router.navigate(['/~']);
        });
      }
    );
  }
}
