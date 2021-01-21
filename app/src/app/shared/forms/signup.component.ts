/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';
import { ApiService, AuthService, UserService } from '@weasel/core/services';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';

interface IFormContent {
  email: string;
  fname: string;
  uname: string;
  upass: string;
}

@Component({
  selector: 'app-forms-signup',
  templateUrl: './signup.component.html'
})
export class SignupFormComponent {

  signupForm = new FormGroup({
    email: new FormControl('', {
      validators: [
        Validators.required,
        Validators.email
      ],
      updateOn: 'blur'
    }),
    fname: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(128)
      ],
      updateOn: 'blur'
    }),
    uname: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern('[a-zA-Z][a-zA-Z0-9]+')
      ],
      updateOn: 'blur'
    }),
    upass: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(64)
      ],
      updateOn: 'change'
    })
  });
  alert: Alert;
  submitted: boolean;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private userService: UserService
  ) { }

  shouldHideAriaDescription(field: string): boolean {
    return (!this.submitted && this.signupForm.controls[field].pristine) ||
        this.signupForm.controls[field].valid;
  }

  onSubmit(model: IFormContent) {
    if (!this.signupForm.valid) {
      return;
    }
    this.submitted = true;
    const body = {
      email: model.email,
      fullname: model.fname,
      username: model.uname,
      password: model.upass,
    };
    this.apiService.post('/auth/signup', body).subscribe(
      () => {
        this.alert = { type: AlertType.Success, text: 'Your account was created.' };
        this.signupForm.reset();
        this.submitted = false;
        this.authService.login(model.uname, model.upass).subscribe(
          () => {
            this.userService.populate();
            const callback = localStorage.getItem(ELocalStorageKey.Callback);
            if (callback) {
              this.router.navigateByUrl(callback);
              return;
            }
            this.router.navigate(['/~']);
          }
        );
      },
      err => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ],
          [ 400, 'user already registered', 'There is already an account associated with this username.' ],
          [ 400, 'email already registered', 'There is already an account associated with this email address.' ],
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    );
  }

}
