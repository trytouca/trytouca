// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from '@ngneat/dialog';
import type {
  EFeatureFlag,
  PlatformStatsResponse,
  PlatformStatsUser,
  UserLookupResponse,
  UserSessionsResponseItem
} from '@touca/api-schema';
import { Subscription, timer } from 'rxjs';

import { RecentEvent } from '@/account/settings/audit.component';
import { ApiKey } from '@/core/models/api-key';
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
import { AlertType } from '@/shared/components/alert.component';
import { Checkbox } from '@/shared/components/checkbox.component';

enum SettingsPageTabType {
  Profile = 'profile',
  ApiKeys = 'apiKeys',
  Preferences = 'preferences',
  Mail = 'mail',
  Metrics = 'metrics',
  Users = 'users',
  Audit = 'audit',
  Billing = 'billing',
  Telemetry = 'telemetry'
}

interface SettingsPageTab {
  type: SettingsPageTabType;
  name: string;
  icon: string;
  hidden?: boolean;
}

@Component({
  selector: 'app-account-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnDestroy {
  private _subs: Subscription[] = [];
  private _subStats: Subscription;
  sessions: UserSessionsResponseItem[];
  user: UserLookupResponse;
  apiKeys: ApiKey[];
  isPlatformAdmin: boolean;

  tabs: SettingsPageTab[] = [
    {
      type: SettingsPageTabType.Profile,
      name: 'Profile',
      icon: 'feather-user'
    },
    {
      type: SettingsPageTabType.ApiKeys,
      name: 'Api Keys',
      icon: 'feather-key'
    },
    {
      type: SettingsPageTabType.Preferences,
      name: 'Preferences',
      icon: 'feather-sliders'
    }
  ];
  adminTabs: SettingsPageTab[] = [
    {
      type: SettingsPageTabType.Metrics,
      name: 'Health Metrics',
      icon: 'feather-activity'
    },
    {
      type: SettingsPageTabType.Users,
      name: 'User Accounts',
      icon: 'feather-users'
    },
    {
      type: SettingsPageTabType.Audit,
      name: 'Audit Logs',
      icon: 'feather-file-text'
    },
    {
      type: SettingsPageTabType.Mail,
      name: 'Mail Transport',
      icon: 'feather-mail'
    },
    {
      type: SettingsPageTabType.Billing,
      name: 'Billing',
      icon: 'feather-credit-card',
      hidden: true
    },
    {
      type: SettingsPageTabType.Telemetry,
      name: 'Telemetry',
      icon: 'feather-upload-cloud'
    }
  ];
  currentTab = this.tabs[0];
  TabType = SettingsPageTabType;

  _preferences: Record<EFeatureFlag, Checkbox & { slug: EFeatureFlag }> = {
    newsletter_product: {
      default: true,
      description:
        'Receive monthly emails about major features and important product updates',
      experimental: false,
      saved: false,
      slug: 'newsletter_product',
      title: 'Monthly Product Updates',
      visible: true
    },
    newsletter_changelog: {
      default: false,
      description:
        'Receive weekly emails about newly released features and improvements',
      experimental: false,
      saved: false,
      slug: 'newsletter_changelog',
      title: 'Weekly Changelog',
      visible: true
    }
  };

  serverSettings: {
    accounts: PlatformStatsUser[];
    events: RecentEvent[];
    stats: Omit<PlatformStatsResponse, 'users'>;
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private router: Router,
    private userService: UserService
  ) {
    this._subs.push(this.fetchUser());
    this.userService.populate();
  }

  ngOnDestroy() {
    this._subs.filter(Boolean).forEach((v) => v.unsubscribe());
    if (this._subStats) {
      this._subStats.unsubscribe();
    }
  }

  private fetchUser() {
    return this.userService.currentUser$.subscribe((user) => {
      user.feature_flags.forEach((v) => {
        if (this._preferences[v]) {
          this._preferences[v].value = true;
        }
      });
      this.isPlatformAdmin =
        user.platformRole === 'owner' || user.platformRole === 'admin';
      this.user = user;
      this.apiKeys = user.apiKeys.map((v) => new ApiKey(v));
      if (this.isPlatformAdmin) {
        this._subStats = this.fetchStats();
      }
      this.fetchSessions();
    });
  }

  private fetchSessions() {
    return this.apiService
      .get<UserSessionsResponseItem[]>('/user/sessions')
      .subscribe((response) => {
        this.sessions = response;
      });
  }

  private fetchStats() {
    return this.apiService
      .get<PlatformStatsResponse>('/platform/stats')
      .subscribe((response) => {
        const { users, ...stats } = response;
        const actions: [
          (arg: PlatformStatsUser) => boolean,
          (arg: PlatformStatsUser) => RecentEvent
        ][] = [
          [(v) => !!v.activationLink, this.build_signup_event],
          [(v) => !!v.resetKeyLink, this.build_reset_event],
          [(v) => !!v.lockedAt, this.build_lock_event]
        ];
        this.serverSettings = {
          accounts: this.build_account_list(users),
          stats: stats,
          events: actions
            .map(([k, v]) => response.users.filter(k).map(v))
            .flat()
            .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
            .slice(0, 6)
        };
      });
  }

  private build_lock_event(v: PlatformStatsUser): RecentEvent {
    return {
      eventDate: v.lockedAt as unknown as Date,
      email: v.email,
      fullname: v.fullname ?? 'Someone',
      username: v.username,
      copyText: `had several failed login attempts. Their account is temporarily locked.`
    };
  }

  private build_signup_event(v: PlatformStatsUser): RecentEvent {
    return {
      eventDate: v.createdAt as unknown as Date,
      email: v.email,
      fullname: 'Someone',
      username: v.username,
      copyLink: v.activationLink,
      copyText: `created an account. They have not logged in yet.`
    };
  }

  private build_reset_event(v: PlatformStatsUser): RecentEvent {
    let copyText = 'requested a password reset.';
    if (
      (v.resetKeyExpiresAt as unknown as Date).getTime() < new Date().getTime()
    ) {
      copyText = copyText.concat(' Their link is now expired.');
    }
    return {
      eventDate: v.resetKeyCreatedAt as unknown as Date,
      email: v.email,
      fullname: v.fullname ?? 'Someone',
      username: v.username,
      copyLink: v.resetKeyLink,
      copyText
    };
  }

  private build_account_list(users: PlatformStatsUser[]) {
    return users
      .filter(
        (user) =>
          !(
            user.suspended &&
            user.fullname === 'Anonymous User' &&
            user.email.startsWith('noreply+') &&
            user.email.endsWith('@touca.io')
          )
      )
      .map((user) => {
        [
          'createdAt',
          'lockedAt',
          'resetKeyExpiresAt',
          'resetKeyCreatedAt'
        ].forEach((k) => {
          if (k in user) {
            user[k] = new Date(user[k] as Date);
          }
        });
        return user;
      })
      .sort((a, b) => +a.createdAt - +b.createdAt);
  }

  confirmAccountDelete() {
    this.openConfirmModal({
      title: 'Delete Account',
      message: `<p>You are about to delete your account which removes your
        personal information and lets others claim <b>${this.user.username}</b>
        as their username. Information submitted to teams created by other
        users will not be deleted. This action is irreversible.</p>`,
      button: 'Delete My Account',
      severity: AlertType.Danger,
      confirmText: this.user.username,
      confirmAction: () => {
        return this.apiService.delete('/user');
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
            'refusing to delete account: server owner',
            'Your account owns this server. It cannot be deleted.'
          ],
          [
            403,
            'refusing to delete account: owns team',
            'You own one or more teams. You cannot delete your account before you delete them or transfer their ownership to someone else.'
          ]
        ]);
      }
    });
  }

  private openConfirmModal(elements: ConfirmElements) {
    this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: elements,
      minHeight: '10vh'
    });
  }

  toggleFeatureFlag(flag: Checkbox) {
    const node = this._preferences[flag.slug];
    node.value = !(node.value ?? false);
    this.userService
      .updateFeatureFlag(flag.slug, node.value as boolean)
      .subscribe({
        next: () => {
          node.saved = true;
          timer(3000).subscribe(() => (node.saved = false));
        }
      });
  }

  switchTab(tab: SettingsPageTab) {
    this.currentTab = tab;
  }

  regenerateApiKey(index: number): void {
    this.userService.updateApiKey(this.user.apiKeys[index]);
  }

  getPreferences(experimental: boolean): Checkbox[] {
    return Object.values(this._preferences).filter(
      (v) => v.experimental === experimental && v.visible
    );
  }

  onCopy(name: string) {
    this.notificationService.notify(
      AlertType.Success,
      `Copied ${name} to clipboard.`
    );
  }

  updateAccount(event: { message: string; url: string }) {
    this.apiService.post(event.url).subscribe(() => {
      this.notificationService.notify(AlertType.Success, event.message);
      this.fetchStats();
    });
  }

  removeSessions(session: string) {
    this.apiService.delete(`/user/sessions/${session}`).subscribe(() => {
      this.fetchSessions();
    });
  }
}
