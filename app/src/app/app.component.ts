/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { GoogleTagManagerService } from 'angular-google-tag-manager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    router: Router,
    gtmService: GoogleTagManagerService
  ) {
    router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.data)
      )
      .subscribe((event: { page?: string; title?: string }) => {
        if (event.page) {
          gtmService.pushTag({ event: 'page', pageName: event.page });
        }
        const title = 'title' in event ? `${event.title} - Weasel` : 'Weasel';
        this.titleService.setTitle(title);
      });
  }
}
