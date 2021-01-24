/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';
import { AuthService } from '@weasel/core/services';

@Component({
  selector: 'app-page-landing',
  templateUrl: './landing.component.html'
})
export class LandingComponent {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    const opts = new Map<string, { p: string; q: string }>([
      ['join', { p: '/~?focus=join', q: 'join' }]
    ]);
    const queryMap = this.route.snapshot.queryParamMap;
    if (queryMap.has('redirect') && opts.has(queryMap.get('redirect'))) {
      const dst = opts.get(queryMap.get('redirect'));
      if (!this.authService.isLoggedIn()) {
        localStorage.setItem(ELocalStorageKey.Callback, dst.p);
        this.router.navigate(['/signin'], { queryParams: { n: dst.q } });
      } else {
        this.router.navigateByUrl(dst.p);
      }
    }
  }
}
