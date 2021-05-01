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
    'Self-hosted deployments now require less than 1 GB of memory instead of 4 GB.',
    'Our platform now creates a team and populates it with sample test results for new users.',
    'You can now remove test results submitted for any given version right from the user interface.',
    'View your API Key and API URL and copy them to clipboard at any time from the suite page.',
    'You can now change your fullname or username from the Account Settings page.'
  ];
}
