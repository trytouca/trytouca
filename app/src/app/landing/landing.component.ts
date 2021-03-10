/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';
import { ApiService, AuthService } from '@weasel/core/services';
import { environment } from 'src/environments/environment';
import { FeatureInput } from './feature.component';

@Component({
  selector: 'app-page-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  /**
   *
   */
  features: FeatureInput[] = [
    {
      colors: ['bg-red-50', 'text-red-800'],
      icon: 'featureSubmit',
      images: [
        {
          alt: 'C++ Programming Language Language',
          link: 'https://github.com/getweasel/weasel-cpp',
          src: '../../assets/exticons/client-cpp.svg',
          title: 'Check Out Weasel Client Library for C++'
        }
      ],
      features: [
        {
          title: 'Integrate in Minutes',
          detail:
            'Use our client libraries to build and run regression test ' +
            'tools for your workflow under test.'
        },
        {
          title: 'Capture without Compromise',
          detail:
            'Capture test results and performance benchmarks of interest ' +
            'from anywhere within your test workflow.'
        },
        {
          title: 'Forget Snapshot Files',
          detail:
            'Post your test results to a remote Weasel Platform where ' +
            'they are retained, compared and processed for insights.'
        },
        {
          title: 'Lossless Comparison',
          detail:
            'Weasel automatically detects and preserves the data types of your test results when capturing and comparing them.'
        }
      ],
      learnMore: {
        link: 'docs',
        title: 'Learn how to submit test results from your test tools'
      },
      title: 'Submit'
    },
    {
      colors: ['bg-green-50', 'text-green-800'],
      icon: 'featureInterpret',
      images: [],
      features: [
        {
          title: '',
          detail: ''
        }
      ],
      learnMore: {
        link: 'docs',
        title:
          'Learn how Weasel processes your results and reports regressions in easy-to-understand format'
      },
      title: 'Interpret'
    },
    {
      colors: ['bg-yellow-50', 'text-yellow-800'],
      icon: 'featureCollaborate',
      images: [],
      features: [
        {
          title: '',
          detail: ''
        }
      ],
      learnMore: {
        link: 'docs',
        title:
          'Learn how Weasel processes your results and reports regressions in easy-to-understand format'
      },
      title: 'Collaborate'
    },
    {
      colors: ['bg-blue-50', 'text-blue-800'],
      icon: 'featureAutomate',
      images: [],
      features: [
        {
          title: '',
          detail: ''
        }
      ],
      learnMore: {
        link: 'docs',
        title:
          'Learn how Weasel processes your results and reports regressions in easy-to-understand format'
      },
      title: 'Automate'
    }
  ];

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
