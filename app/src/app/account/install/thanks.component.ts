// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ELocalStorageKey } from '@/core/models/frontendtypes';

@Component({
  selector: 'app-account-install-thanks',
  templateUrl: './thanks.component.html'
})
export class InstallThanksComponent {
  constructor(private router: Router) {}

  navigateToSignup() {
    const key = localStorage.getItem(ELocalStorageKey.ActivationKey);
    if (key) {
      this.router.navigate(['/account/activate'], { queryParams: { key } });
      localStorage.removeItem(ELocalStorageKey.ActivationKey);
    } else {
      this.router.navigate(['/account/signup']);
    }
  }
}
