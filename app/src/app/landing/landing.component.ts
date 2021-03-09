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
      icon: `<svg class="inline h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>`,
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
      icon: `<svg class="inline h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>`,
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
      icon: `<svg class="inline h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>`,
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
      icon: `<svg class="inline h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>`,
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
