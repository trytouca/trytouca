// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faClipboard,
  faEye,
  faEyeSlash,
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons';
import { DialogService } from '@ngneat/dialog';
import { IClipboardResponse } from 'ngx-clipboard';
import { Subscription, timer } from 'rxjs';

import { UserLookupResponse } from '@/core/models/commontypes';
import { formFields, FormHint, FormHints } from '@/core/models/form-hint';
import {
  ApiService,
  AuthService,
  NotificationService,
  UserService
} from '@/core/services';
import {
  ConfirmComponent,
  ConfirmElements
} from '@/home/components/confirm.component';
import { Alert, AlertType } from '@/shared/components/alert.component';
import { Checkbox } from '@/shared/components/checkbox.component';

enum EModalType {
  ChangePersonal = 'changePersonal',
  DeleteAccount = 'deleteAccount'
}

interface FormContent {
  fname: string;
  uname: string;
}

class ApiKey {
  private _clean: string;
  private _shown = false;
  constructor(private readonly _key: string) {
    const parts = this._key.split('-');
    const middle = parts
      .splice(1, parts.length - 2)
      .map((v) => new Array(v.length + 1).join('*'));
    this._clean = [parts[0], ...middle, parts[parts.length - 1]].join('-');
  }
  toggle(): void {
    this._shown = !this._shown;
  }
  get plain(): string {
    return this._key;
  }
  get shown(): boolean {
    return this._shown;
  }
  get value(): string {
    return this._shown ? this._key : this._clean;
  }
}

@Component({
  selector: 'app-account-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnDestroy {
  private _subUser: Subscription;
  private _subHints: Subscription;
  alert: Partial<Record<EModalType, Alert>> = {};
  user: UserLookupResponse;
  EModalType = EModalType;
  apiKeys: ApiKey[];

  preferences: Record<string, Checkbox> = {
    newsletter_product: {
      default: false,
      description:
        'Receive monthly updates about newly released features and improvements',
      experimental: false,
      saved: false,
      slug: 'newsletter_product',
      title: 'Subscribe to Product Updates Newsletter'
    },
    colored_topics: {
      default: false,
      description:
        'Use color identifiers to better distinguish properties of each test case',
      experimental: true,
      saved: false,
      slug: 'colored_topics',
      title: 'Color Identifiers'
    }
  };

  accountSettingsForm = new FormGroup({
    email: new FormControl('', {
      validators: formFields.email.validators,
      updateOn: 'blur'
    }),
    fname: new FormControl('', {
      validators: formFields.fname.validators,
      updateOn: 'blur'
    }),
    uname: new FormControl('', {
      validators: formFields.uname.validators,
      updateOn: 'blur'
    })
  });

  hints = new FormHints({
    email: new FormHint(
      'Contact us if you like to change your email address',
      formFields.email.validationErrors
    ),
    fname: new FormHint('', formFields.fname.validationErrors),
    uname: new FormHint('', formFields.uname.validationErrors)
  });

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private router: Router,
    private userService: UserService,
    private faIconLibrary: FaIconLibrary
  ) {
    faIconLibrary.addIcons(faClipboard, faEye, faEyeSlash, faSyncAlt);
    this._subHints = this.hints.subscribe(this.accountSettingsForm, [
      'fname',
      'uname'
    ]);
    this._subUser = this.userService.currentUser$.subscribe((user) => {
      user.feature_flags.forEach((v) => {
        this.preferences[v].value = true;
      });
      this.user = user;
      this.accountSettingsForm.get('email').setValue(user.email);
      this.accountSettingsForm.get('email').disable();
      this.accountSettingsForm.get('fname').setValue(user.fullname);
      this.accountSettingsForm.get('uname').setValue(user.username);
      this.apiKeys = user.apiKeys.map((v) => new ApiKey(v));
    });
    this.userService.populate();
  }

  ngOnDestroy() {
    this._subHints.unsubscribe();
    this._subUser.unsubscribe();
  }

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
    this.apiService.patch('/user', info).subscribe({
      next: () => {
        this.alert.changePersonal = {
          type: AlertType.Success,
          text: 'Your account information was updated.'
        };
        timer(5000).subscribe(() => (this.alert.changePersonal = undefined));
        this.hints.reset();
        this.userService.reset();
        this.userService.populate();
      },
      error: (err) => {
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
    });
  }

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
              this.router.navigate(['/account/signin']);
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

  toggleFeatureFlag(flag: Checkbox) {
    const node = this.preferences[flag.slug];
    node.value = !(node.value ?? false);
    this.userService.updateFeatureFlag(flag.slug, node.value).subscribe({
      next: () => {
        node.saved = true;
        timer(3000).subscribe(() => (node.saved = false));
      }
    });
  }

  onCopy(event: IClipboardResponse) {
    this.notificationService.notify(
      AlertType.Success,
      'Copied API Key to clipboard.'
    );
  }

  regenerateApiKey(index: number): void {
    this.userService.updateApiKey(this.user.apiKeys[index]);
  }
}
