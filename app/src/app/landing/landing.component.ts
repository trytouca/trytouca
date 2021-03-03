/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';
import { ApiService, AuthService } from '@weasel/core/services';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-page-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  /**
   *
   */
  formSignup = new FormGroup({
    email: new FormControl('', {
      validators: [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ],
      updateOn: 'blur'
    })
  });

  ctaSignupOutcome: {
    success: boolean;
    message: string;
  };

  /**
   *
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
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
        this.router.navigate(['/account/signin'], {
          queryParams: { n: dst.q }
        });
      } else {
        this.router.navigateByUrl(dst.p);
      }
    }
  }

  /**
   *
   */
  ctaLiveDemo() {
    if (environment.production) {
      window.open('https://calendly.com/ghorbanzade/weasel', '_blank');
    }
  }

  /**
   *
   */
  ctaSignup(model: { email: string }) {
    if (!this.formSignup.valid) {
      return;
    }
    this.apiService.post('/auth/signup', { email: model.email }).subscribe(
      () => {
        this.ctaSignupOutcome = {
          success: true,
          message: 'Check your inbox to complete your account registration.'
        };
        this.formSignup.reset();
      },
      (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'email is invalid', 'Your email address appears invalid.'],
          [
            400,
            'email already registered',
            'There is already an account associated with this email address.'
          ]
        ]);
        this.ctaSignupOutcome = {
          success: false,
          message: msg
        };
      }
    );
  }

  /**
   *
   */
  isStartFormValid() {
    const field = this.formSignup.controls['email'];
    return field.pristine || field.valid;
  }
}
