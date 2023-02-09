// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationStart,
  Router
} from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { filter, first, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private cookieService: CookieService,
    router: Router
  ) {
    // handles cli login flow
    router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        first()
      )
      ?.subscribe((event: NavigationStart) => {
        if (event.url.includes('?')) {
          const query = event.url.split('?').pop();
          const searchParams = new URLSearchParams(query);

          if (searchParams.has('token')) {
            const token = searchParams.get('token');

            this.cookieService.delete('clientAuthToken', '/');
            this.cookieService.set('clientAuthToken', token, null, '/');

            router.navigate([], {
              queryParams: { token: null },
              queryParamsHandling: 'merge'
            });
          }
        }
      });

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
  }
}
