/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';
import { ApiService, AuthService, UserService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';

interface FormContent {
  uname: string;
  upass: string;
}

@Component({
  selector: 'wsl-account-signin',
  templateUrl: './signin.component.html'
})
export class SigninComponent implements OnInit {
  formSignin = new FormGroup({
    uname: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern('[a-zA-Z0-9]+')
      ],
      updateOn: 'blur'
    }),
    upass: new FormControl('', {
      validators: [Validators.required, Validators.minLength(8)],
      updateOn: 'change'
    })
  });
  alert: Alert;
  submitted: boolean;
  prev: FormContent;

  /**
   *
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  /**
   *
   */
  ngOnInit() {
    const queryMap = this.route.snapshot.queryParamMap;
    if (queryMap.has('e') && queryMap.get('e') === '401') {
      this.alert = {
        type: AlertType.Info,
        text: 'It looks like you were signed out.'
      };
    } else if (queryMap.has('n') && queryMap.get('n') === 'join') {
      this.alert = {
        type: AlertType.Info,
        text: 'Please sign in to respond to your team invitation.'
      };
    }
  }

  /**
   *
   */
  onSubmit(model: FormContent) {
    if (this.formSignin.pristine) {
      return;
    }
    if (!this.formSignin.valid) {
      this.alert = {
        type: AlertType.Danger,
        text: 'Incorrect username or password.'
      };
      return;
    }
    if (this.prev === model) {
      return;
    }
    this.authService.login(model.uname, model.upass).subscribe(
      () => {
        this.userService.populate();
        this.formSignin.reset();
        this.prev = null;
        const callback = localStorage.getItem(ELocalStorageKey.Callback);
        if (callback) {
          this.router.navigateByUrl(callback);
          return;
        }
        this.router.navigate(['/~']);
      },
      (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.'],
          [401, 'invalid login credentials', 'Incorrect username or password.'],
          [423, 'account suspended', 'Your account is currently suspended.'],
          [423, 'account locked', 'Your account is temporarily locked.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
        this.prev = model;
      }
    );
  }
}
