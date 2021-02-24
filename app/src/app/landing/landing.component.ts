/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';
import { AuthService } from '@weasel/core/services';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-page-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  startForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      updateOn: 'blur'
    })
  });

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

  ctaLiveDemo() {
    if (environment.production) {
      window.open('https://calendly.com/ghorbanzade/weasel', '_blank');
    }
  }

  ctaStart(model: { email: string }) {
    if (!this.startForm.valid) {
      return;
    }
    this.router.navigate(['/signup']);
  }

  isStartFormValid() {
    const field = this.startForm.controls['email'];
    return field.pristine || field.valid;
  }
}
