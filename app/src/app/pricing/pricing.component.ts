/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { PricingPlan } from './plan.component';

@Component({
  selector: 'wsl-page-pricing',
  templateUrl: './pricing.component.html',
  styles: []
})
export class PricingComponent {
  plans: PricingPlan[] = [
    {
      title: 'Free',
      description: 'Up to 2 users.',
      features: [
        'Unlimited Suites',
        '100 Test Cases per Suite',
        '50 versions per month',
        '1 Month Data Retention'
      ],
      fee: 0,
      button: {
        title: 'Sign Up',
        link: '/account/signup',
        query: { plan: 'free' }
      }
    },
    {
      title: 'Startup',
      fee: 99,
      description: 'Up to 5 users.',
      features: [
        'Unlimited Suites',
        'Unlimited Test Cases',
        '100 versions per month',
        '6 Months Data Retention',
        'Platform API Access'
      ],
      button: {
        title: 'Start a Free Trial',
        link: '/account/signup',
        query: { plan: 'startup' }
      }
    },
    {
      title: 'Business',
      fee: 499,
      description: 'Up to 20 users.',
      features: [
        'Unlimited Suites',
        'Unlimited Test Cases',
        '500 versions per month',
        '2 Years Data Retention',
        'Platform API Access',
        'Professional Services'
      ],
      button: {
        title: 'Start a Free Trial',
        link: '/account/signup',
        query: { plan: 'business' }
      }
    },
    {
      title: 'Enterprise',
      description: 'Unlimited Users.',
      features: [
        'Unlimited Suites',
        'Unlimited Test Cases',
        'Unlimited Versions',
        'Unlimited Data Retention',
        'Platform API Access',
        'Professional Services',
        'Self-Hosting Option'
      ],
      button: {
        title: 'Contact Us',
        link: '/account/signup',
        query: { plan: 'enterprise' }
      }
    }
  ];
}
