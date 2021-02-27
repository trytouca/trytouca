/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

enum StartPageType {
  Reset = 'reset',
  Signin = 'signin',
  Signup = 'signup'
}

@Component({
  selector: 'wsl-account-start',
  templateUrl: './start.component.html'
})
export class StartComponent {
  currentPage: StartPageType;
  PageType = StartPageType;

  constructor(route: ActivatedRoute) {
    this.currentPage = route.snapshot.data.page as StartPageType;
  }
}
