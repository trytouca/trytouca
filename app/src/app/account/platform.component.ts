/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { faClipboard, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import {
  PlatformStatsResponse,
  PlatformStatsUser
} from '@weasel/core/models/commontypes';
import { ApiService, NotificationService } from '@weasel/core/services';
import { AlertType } from '@weasel/shared/components/alert.component';
import { formatDistanceToNow } from 'date-fns';
import { IClipboardResponse } from 'ngx-clipboard';
import { Subscription } from 'rxjs';

/**
 *
 */
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
  selector: 'wsl-account-platform',
  templateUrl: './platform.component.html'
})
export class PlatformComponent implements OnDestroy {
  private _sub: Subscription;
  stats: PlatformStatsResponse;
  events: RecentEvent[] = [];
  faClipboard = faClipboard;
  faEllipsisV = faEllipsisV;
  faEnvelope = faEnvelope;

  /**
   *
   */
  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {
    this._sub = this.apiService
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

  /**
   *
   */
  ngOnDestroy() {
    this._sub.unsubscribe();
  }

  /**
   *
   */
  private build_lock_event(v: PlatformStatsUser): RecentEvent {
    return {
      eventDate: v.lockedAt,
      email: v.email,
      fullname: v.fullname || 'Someone',
      username: v.username,
      copyText: `had several failed login attempts. Their account is temporarily locked.`
    };
  }

  /**
   *
   */
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

  /**
   *
   */
  private build_reset_event(v: PlatformStatsUser): RecentEvent {
    let copyText = 'requested a password reset.';
    if (v.resetKeyExpiresAt.getTime() < new Date().getTime()) {
      copyText = copyText.concat(' Their link is now expired.');
    }
    return {
      eventDate: v.resetKeyCreatedAt,
      email: v.email,
      fullname: v.fullname || 'Someone',
      username: v.username,
      copyLink: v.resetKeyLink,
      copyText
    };
  }

  /**
   *
   */
  onCopy(event: IClipboardResponse, name: string) {
    this.notificationService.notify(
      AlertType.Success,
      `Copied ${name} to clipboard.`
    );
  }

  /**
   *
   */
  suspendUser(user: PlatformStatsUser) {
    this.apiService
      .post(`/platform/account/${user.username}/suspend`)
      .subscribe(() => {
        this.notificationService.notify(
          AlertType.Success,
          `Account for ${user.fullname || user.username} was suspended.`
        );
      });
  }

  /**
   *
   */
  describeEventDate(eventDate: Date) {
    return formatDistanceToNow(eventDate, { addSuffix: true });
  }
}
