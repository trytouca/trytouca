/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { formatDistanceToNow } from 'date-fns';
import { faClipboard, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import {
  PlatformStatsResponse,
  PlatformStatsUser
} from '@weasel/core/models/commontypes';
import { ApiService, NotificationService } from '@weasel/core/services';
import { AlertType } from '@weasel/shared/components/alert.component';

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
export class PlatformComponent {
  private _sub: Subscription;
  stats: PlatformStatsResponse;
  events: RecentEvent[] = [];
  faClipboard = faClipboard;
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
          const keys = ['createdAt', 'resetKeyExpiresAt', 'resetKeyCreatedAt'];
          keys.forEach((k) => {
            if (k in user) {
              user[k] = new Date(user[k]);
            }
          });
        });
        this.stats = response;
        const events: RecentEvent[] = [];
        events.push(
          ...response.users
            .filter((v) => v.activationLink)
            .map(this.build_signup_event)
        );
        events.push(
          ...response.users
            .filter((v) => v.resetKeyLink)
            .map(this.build_reset_event)
        );
        this.events = events
          .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
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
      fullname: v.fullname,
      username: v.username,
      copyLink: v.resetKeyLink,
      copyText
    };
  }

  /**
   *
   */
  public onCopy(event: string) {
    this.notificationService.notify(
      AlertType.Success,
      'Copied value to clipboard.'
    );
  }

  /**
   *
   */
  describeEventDate(eventDate: Date) {
    return formatDistanceToNow(eventDate, { addSuffix: true });
  }
}
