// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';

@Component({
  selector: 'app-account-feature',
  templateUrl: './feature.component.html'
})
export class FeatureComponent {
  features: string[] = [
    'The team list page is now merged with the team overview page.',
    'New members now see their team invitations in a separate tab.',
    'Color-coded metadata tags are no longer under feature flag.',
    'Self-hosted deployments now require less than 1 GB of memory instead of 4 GB.'
  ];
}
