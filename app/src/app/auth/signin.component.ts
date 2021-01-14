/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';
import { ApiService, AuthService, UserService } from '@weasel/core/services';

interface IFormContent {
  uname: string;
  upass: string;
}

enum Alerts {
  Info = 'wsl-alert-info',
  Success = 'wsl-alert-success',
  Danger = 'wsl-alert-danger'
}

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html'
})
export class SigninComponent implements OnInit {

  signinForm = new FormGroup({
    uname: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern('[a-zA-Z0-9]+')
      ],
      updateOn: 'blur'
    }),
    upass: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(8),
      ],
      updateOn: 'change'
    })
  });
  alert?: [Alerts, string];
  submitted: boolean;
  prev: IFormContent;

  /**
   *
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private userService: UserService
  ) { }

  /**
   *
   */
  ngOnInit() {
    const queryMap = this.route.snapshot.queryParamMap;
    if (queryMap.has('e') && queryMap.get('e') === '401') {
      this.alert = [ Alerts.Info, 'It looks like you were signed out.' ];
    }
    if (queryMap.has('n') && queryMap.get('n') === 'join') {
      this.alert = [ Alerts.Info, 'Please sign in to respond to your team invitation.'];
    }
  }

  /**
   *
   */
  shouldHideAriaDescription(field: string): boolean {
    return (!this.submitted && this.signinForm.controls[field].pristine) ||
        this.signinForm.controls[field].valid;
  }

  /**
   *
   */
  async onSubmit(model: IFormContent) {
    if (this.signinForm.pristine) {
      return;
    }
    if (!this.signinForm.valid) {
      this.alert = [Alerts.Danger, 'Incorrect username or password.'];
      return;
    }
    if (this.prev === model) {
      return;
    }
    this.submitted = true;
    this.authService.login(model.uname, model.upass).subscribe(
      () => {
        this.userService.populate();
        this.signinForm.reset();
        this.submitted = false;
        this.prev = null;
        const callback = localStorage.getItem(ELocalStorageKey.Callback);
        if (callback) {
          this.router.navigateByUrl(callback);
          return;
        }
        this.router.navigate(['/~']);
      },
      err => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ],
          [ 401, 'invalid login credentials', 'Incorrect username or password.' ],
          [ 423, 'account suspended', 'Your account is currently suspended.' ],
          [ 423, 'account locked', 'Your account is temporarily locked.' ]
        ]);
        this.alert = [Alerts.Danger, msg];
        this.prev = model;
      }
    );
  }

}
