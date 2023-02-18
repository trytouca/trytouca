// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-account-signin-github',
  template: ''
})
export class SigninGithubComponent {
  constructor(private route: ActivatedRoute) {
    console.log(this.route);
  }
}
