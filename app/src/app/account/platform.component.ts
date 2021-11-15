// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';
import { IClipboardResponse } from 'ngx-clipboard';
import { Subscription } from 'rxjs';

import {
  PlatformStatsResponse,
  PlatformStatsUser,
  UserLookupResponse
} from '@/core/models/commontypes';
import { ApiService, NotificationService, UserService } from '@/core/services';
import { AlertType } from '@/shared/components/alert.component';

interface RecentEvent {
  copyLink?: string;
  copyText: string;
  email: string;
  eventDate: Date;
  expiresAt?: Date;
  fullname: string;
  username: string;
}

@Component({
  selector: 'app-account-platform',
  templateUrl: './platform.component.html'
})
export class PlatformComponent implements OnDestroy {
  events: RecentEvent[] = [];
  stats: PlatformStatsResponse;
  user: UserLookupResponse;
  private _subs: Subscription[] = [];

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    userService: UserService
  ) {
    this._subs.push(
      this.fetchStats(),
      userService.currentUser$.subscribe((user) => (this.user = user))
    );
    userService.populate();
  }

  ngOnDestroy() {
    this._subs.filter(Boolean).forEach((v) => v.unsubscribe());
  }

  private fetchStats() {
    return this.apiService
      .get<PlatformStatsResponse>('/platform/stats')
      .subscribe((response) => {
        response.users.forEach((user) => {
          [
            'createdAt',
            'lockedAt',
            'resetKeyExpiresAt',
            'resetKeyCreatedAt'
          ].forEach((k) => {
            if (k in user) {
              user[k] = new Date(user[k]);
            }
          });
        });
        this.stats = response;
        const actions: [
          (arg: PlatformStatsUser) => boolean,
          (arg: PlatformStatsUser) => RecentEvent
        ][] = [
          [(v) => !!v.activationLink, this.build_signup_event],
          [(v) => !!v.resetKeyLink, this.build_reset_event],
          [(v) => !!v.lockedAt, this.build_lock_event]
        ];
        this.events = actions
          .map(([k, v]) => response.users.filter(k).map(v))
          .flat()
          .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
          .slice(0, 6);
      });
  }

  private build_lock_event(v: PlatformStatsUser): RecentEvent {
    return {
      eventDate: v.lockedAt,
      email: v.email,
      fullname: v.fullname ?? 'Someone',
      username: v.username,
      copyText: `had several failed login attempts. Their account is temporarily locked.`
    };
  }

  private build_signup_event(v: PlatformStatsUser): RecentEvent {
    return {
      eventDate: v.createdAt,
      email: v.email,
      fullname: 'Someone',
      username: v.username,
      copyLink: v.activationLink,
      copyText: `created an account. They have not logged in yet.`
    };
  }

  private build_reset_event(v: PlatformStatsUser): RecentEvent {
    let copyText = 'requested a password reset.';
    if (v.resetKeyExpiresAt.getTime() < new Date().getTime()) {
      copyText = copyText.concat(' Their link is now expired.');
    }
    return {
      eventDate: v.resetKeyCreatedAt,
      email: v.email,
      fullname: v.fullname ?? 'Someone',
      username: v.username,
      copyLink: v.resetKeyLink,
      copyText
    };
  }

  onCopy(event: IClipboardResponse, name: string) {
    this.notificationService.notify(
      AlertType.Success,
      `Copied ${name} to clipboard.`
    );
  }

  suspendAccount(user: PlatformStatsUser) {
    this.updateAccount(
      `/platform/account/${user.username}/suspend`,
      `Account for ${user.fullname || user.username} was suspended.`
    );
  }

  deleteAccount(user: PlatformStatsUser) {
    this.updateAccount(
      `/platform/account/${user.username}/delete`,
      `Account for ${user.fullname || user.username} was deleted.`
    );
  }

  private updateAccount(url: string, successMessage: string) {
    this.apiService.post(url).subscribe(() => {
      this.notificationService.notify(AlertType.Success, successMessage);
      this.fetchStats();
    });
  }

  describeEventDate(eventDate: Date) {
    return formatDistanceToNow(eventDate, { addSuffix: true });
  }
}
