// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-install-thanks',
  templateUrl: './thanks.component.html'
})
export class InstallThanksComponent {
  constructor(private router: Router) {}

  proceed() {
    this.router.navigate(['/~']);
  }
}
