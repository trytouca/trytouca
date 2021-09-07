// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, Input } from '@angular/core';

type NotFound = Partial<{
  teamSlug: string;
  suiteSlug: string;
  batchSlug: string;
  elementSlug: string;
}>;

enum ENotFound {
  Team = 'team',
  Suite = 'suite',
  Batch = 'batch',
  Element = 'element'
}

type PageElements = {
  type: ENotFound;
  title: string;
  image: string;
  message: string;
  button: string;
};

@Component({
  selector: 'app-home-notfound',
  templateUrl: './home-notfound.component.html'
})
export class HomeNotFoundComponent {
  data: PageElements;

  @Input()
  set args(args: NotFound) {
    if (args.elementSlug) {
      this.data = {
        type: ENotFound.Element,
        title: 'Element Not Found',
        image: './assets/undraw/undraw_not_found_60pq.svg',
        message: `Element <b>${args.elementSlug}</b> does not exist.`,
        button: 'Back to Version'
      };
    }
    if (args.batchSlug) {
      this.data = {
        type: ENotFound.Batch,
        title: 'Version Not Found',
        image: './assets/undraw/undraw_not_found_60pq.svg',
        message: `Version <b>${args.batchSlug}</b> does not exist.`,
        button: 'Back to Suite'
      };
    }
    if (args.suiteSlug) {
      this.data = {
        type: ENotFound.Suite,
        title: 'Suite Not Found',
        image: './assets/undraw/undraw_not_found_60pq.svg',
        message: `Suite <b>${args.suiteSlug}</b> does not exist or you may not have permissions to view it.`,
        button: 'Back to Your Suites'
      };
    }
    if (args.teamSlug) {
      this.data = {
        type: ENotFound.Team,
        title: 'Team Not Found',
        image: './assets/undraw/undraw_not_found_60pq.svg',
        message: `Team <b>${args.teamSlug}</b> does not exist or you may not have permissions to view it.`,
        button: 'Back to Your Teams'
      };
    }
  }
}
