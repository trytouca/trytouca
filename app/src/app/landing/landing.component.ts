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
      colors: ['bg-red-50', 'border-red-100', 'text-red-800'],
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
            'Use our open source client libraries to build and run ' +
            'regression test tools for your workflow under test.'
        },
        {
          title: 'Collect Test Results',
          detail:
            'Inspect important variables whose value should remain the ' +
            'same between different versions, given the same set of inputs.'
        },
        {
          title: 'Add Performance Benchmarks',
          detail:
            'Track runtime of functions and other execution flows ' +
            'to identify noticeable changes between different versions.'
        },
        {
          title: 'Forget Snapshot Files',
          detail:
            'Post your test results to a remote Weasel Platform where ' +
            'they are retained, compared and processed for insights.'
        }
      ],
      learnMore: {
        link: 'docs',
        title: 'Learn how to submit test results from your test tools'
      },
      title: 'Submit'
    },
    {
      colors: ['bg-green-50', 'border-green-100', 'text-green-800'],
      features: [
        {
          title: 'Get Real-Time Feedback',
          detail:
            'See newly-found differences between your current version and the baseline version, as your test is running.'
        },
        {
          title: 'Start with Insights',
          detail:
            'Use insights generated based on the newly-found differences to have a head start in understanding their root cause.'
        },
        {
          title: 'Stay in the Loop',
          detail:
            'Get notified when regressions occur in new versions of your software workflows.'
        }
      ],
      learnMore: {
        link: 'docs',
        title:
          'Learn how Weasel processes your results and reports regressions in an easy-to-understand format'
      },
      title: 'Interpret'
    },
    {
      colors: ['bg-yellow-50', 'border-yellow-100', 'text-yellow-800'],
      features: [
        {
          title: 'Comment on Test Results',
          detail:
            'Share the results of your investigation with your team and discuss whether newly-found differences are suspicious or expected.'
        },
        {
          title: 'Manage your Baseline Version',
          detail:
            'Change the approved baseline version of your software workflows with a single click and a note to your colleagues to explain why.'
        },
        {
          title: 'Generate Audit Reports',
          detail:
            'Export a report of how your software workflows and their baseline versions evolve over time for inclusion in release documents.'
        }
      ],
      learnMore: {
        link: 'docs',
        title:
          'Learn how Weasel helps your team have an up-to-date understanding of the behavior of your software.'
      },
      title: 'Collaborate'
    },
    {
      colors: ['bg-blue-50', 'border-blue-100', 'text-blue-800'],
      features: [
        {
          title: 'Make your Tests Continuous',
          detail:
            'Run your regression test workflows as part of your continuous ' +
            'integration workflow or run them separately by installing our ' +
            'remote agent on a dedicated test machine.'
        },
        {
          title: 'Use a Unified Test Framework',
          detail:
            'Use our open-source extensible test frameworks to build ' +
            'resilient easy-to-automate regression test tools in less ' +
            'than a half hour.'
        }
      ],
      learnMore: {
        link: 'docs',
        title:
          'Learn how Weasel can help you manage and automate the execution of your regression tests.'
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
