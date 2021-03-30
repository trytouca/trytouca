/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { DialogService } from '@ngneat/dialog';
import { ApiService, AuthService, UserService } from '@weasel/core/services';
import { UserLookupResponse } from '@weasel/core/models/commontypes';
import { Alert, AlertType } from '@weasel/shared/components/alert.component';
import { FormHint, FormHints, formFields } from '@weasel/account/form-hint';
import {
  ConfirmComponent,
  ConfirmElements
} from '@weasel/home/components/confirm.component';

enum EModalType {
  ChangePersonal = 'changePersonal',
  DeleteAccount = 'deleteAccount'
}

interface FormContent {
  fname: string;
  uname: string;
}

@Component({
  selector: 'wsl-account-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnDestroy {
  private _subUser: Subscription;
  private _subHints: Subscription;
  alert: Partial<Record<EModalType, Alert>> = {};
  user: UserLookupResponse;
  EModalType = EModalType;

  /**
   *
   */
  accountSettingsForm = new FormGroup({
    fname: new FormControl('', {
      validators: formFields.fname.validators,
      updateOn: 'blur'
    }),
    uname: new FormControl('', {
      validators: formFields.uname.validators,
      updateOn: 'blur'
    })
  });

  /**
   *
   */
  hints = new FormHints({
    fname: new FormHint('', formFields.fname.validationErrors),
    uname: new FormHint('', formFields.uname.validationErrors)
  });

  /**
   *
   */
  constructor(
    private router: Router,
    private dialogService: DialogService,
    private apiService: ApiService,
    private authService: AuthService,
    private userService: UserService
  ) {
    this._subHints = this.hints.subscribe(this.accountSettingsForm, [
      'fname',
      'uname'
    ]);
    this._subUser = this.userService.currentUser$.subscribe((user) => {
      this.user = user;
      this.accountSettingsForm.get('fname').setValue(user.fullname);
      this.accountSettingsForm.get('uname').setValue(user.username);
    });
    this.userService.populate();
  }

  /**
   *
   */
  ngOnDestroy() {
    this._subHints.unsubscribe();
    this._subUser.unsubscribe();
  }

  /**
   *
   */
  onSubmit(model: FormContent) {
    if (!this.accountSettingsForm.valid) {
      return;
    }
    const info: Partial<Record<'fullname' | 'username', string>> = {};
    if (this.user.fullname !== model.fname) {
      info.fullname = model.fname;
    }
    if (this.user.username !== model.uname) {
      info.username = model.uname;
    }
    if (Object.keys(info).length === 0) {
      return;
    }
    this.apiService.patch('/user', info).subscribe(
      () => {
        this.alert.changePersonal = {
          type: AlertType.Success,
          text: 'Your account information was updated.'
        };
        timer(5000).subscribe(() => (this.alert.changePersonal = undefined));
        this.hints.reset();
        this.userService.reset();
        this.userService.populate();
      },
      (err) => {
        const error = this.apiService.extractError(err, [
          [409, 'username already registered', 'This username is taken']
        ]);
        timer(2000).subscribe(() => {
          this.alert.changePersonal = undefined;
          this.hints.reset();
          this.userService.reset();
          this.userService.populate();
        });
        this.alert.changePersonal = { text: error, type: AlertType.Danger };
      }
    );
  }

  /**
   *
   */
  openConfirmModal(type: EModalType) {
    const elements = new Map<EModalType, ConfirmElements>([
      [
        EModalType.DeleteAccount,
        {
          title: 'Delete Account',
          message: `<p>You are about to delete your account which removes your
            personal information and lets others claim <b>${this.user.username}</b>
            as their username. Information submitted to teams created by other
            users will not be deleted. This action is irreversible.</p>`,
          button: 'Delete My Account',
          severity: AlertType.Danger,
          confirmText: this.user.username,
          confirmAction: () => {
            return this.apiService.delete('/platform/account');
          },
          onActionSuccess: () => {
            this.authService.logout().subscribe(() => {
              this.userService.reset();
              this.router.navigate(['/']);
            });
          },
          onActionFailure: (err: HttpErrorResponse) => {
            return this.apiService.extractError(err, [
              [
                403,
                'refusing to delete account: platform owner',
                'Your account owns this platform. It cannot be deleted.'
              ],
              [
                403,
                'refusing to delete account: owns team',
                'You own one or more teams. You cannot delete your account before you delete them or transfer their ownership to someone else.'
              ]
            ]);
          }
        }
      ]
    ]);
    if (!elements.has(type)) {
      return;
    }
    this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: elements.get(type),
      minHeight: '10vh'
    });
  }
}
