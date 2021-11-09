// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';

@Component({
  selector: 'app-account-feature',
  templateUrl: './feature.component.html'
})
export class FeatureComponent {
  features: string[] = [
    'New members now see their team invitations in a separate tab.',
    'The team list page is now merged with the team overview page.',
    'You can now color-code metadata tags for each version to read them more easily.',
    'Self-hosted deployments now require less than 1 GB of memory instead of 4 GB.'
  ];
}
