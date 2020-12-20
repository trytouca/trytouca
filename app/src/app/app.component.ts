/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { UserService } from './core/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})

export class AppComponent implements OnInit {

  appNameLogo = 'Weasel';
  appNameBrief = 'Weasel';
  appNameVerbose = 'Weasel';

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map((route) => {
        while (route.firstChild) { route = route.firstChild; }
        return route;
      }),
      filter((route) => route.outlet === 'primary'),
      mergeMap((route) => route.data)
    ).subscribe((event) => {
      const name = 'title' in event ?
        event.title + ' - ' + this.appNameBrief : this.appNameVerbose;
      this.titleService.setTitle(name);
    });
  }

}
