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

enum Alerts {
  Success = 'alert-success',
  Danger = 'alert-danger'
}

@Component({
  selector: 'app-activate',
  templateUrl: 'activate.component.html'
})
export class ActivateComponent implements OnInit {

  alert: [Alerts, string];

  /**
   *
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private faIconLibrary: FaIconLibrary
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
    if (!this.authService.isLoggedIn()) {
      localStorage.setItem(ELocalStorageKey.Callback, `/activate?key=${key}`);
      this.router.navigate(['/signin']);
    }
    this.apiService.post(`/auth/activate/${key}`).subscribe(
      () => {
        localStorage.removeItem(ELocalStorageKey.Callback);
        this.router.navigate(['/~']);
      },
      err => {
        const error = this.apiService.extractError(err, [
          [ 400, 'invalid activation key', 'This activation key is invalid.' ],
          [ 404, 'activation key not found', 'This activation key has expired.' ]
        ]);
        this.alert = [ Alerts.Danger, error ];
        localStorage.removeItem(ELocalStorageKey.Callback);
        timer(5000).subscribe(() => this.router.navigate(['/~']));
      });
  }

}
