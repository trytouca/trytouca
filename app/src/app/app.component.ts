// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { applyAppearance, listenToAppearanceChange } from './core/models/theme';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    router: Router
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
        const title = 'title' in event ? `${event.title} - Touca` : 'Touca';
        this.titleService.setTitle(title);
      });
    applyAppearance();
    listenToAppearanceChange();
  }
}
