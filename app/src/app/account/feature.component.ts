/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';

@Component({
  selector: 'wsl-account-feature',
  templateUrl: './feature.component.html'
})
export class FeatureComponent {
  features: string[] = [
    'Our platform now creates a team and populates it with sample test results for new users.',
    'You can now remove test results submitted for any given version right from the user interface.',
    'View your API Key and API URL and copy them to clipboard at any time from the suite page.',
    'Building our Client Library for C++ now only requires CMake.',
    'Our Test Framework for C++ can now seal the version after executing all test cases.'
  ];
}
