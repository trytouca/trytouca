/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { IClipboardResponse } from 'ngx-clipboard';

import type { Promotion, SuiteLookupResponse } from '@/core/models/commontypes';
import { NotificationService } from '@/core/services';
import {
  FrontendVersionListParamsType,
  isElementParams
} from '@/home/components/version-list.component';
import { AlertType } from '@/shared/components/alert.component';

@Component({
  selector: 'app-home-version-navigator',
  templateUrl: './version-navigator.component.html'
})
export class VersionNavigatorComponent {
  faLink = faLink;

  @Input() suite: SuiteLookupResponse;
  @Input() params: FrontendVersionListParamsType;

  /**
   *
   */
  constructor(private notificationService: NotificationService) {}

  /**
   *
   */
  get baseline(): Promotion {
    return this.suite.promotions.slice(-1)[0];
  }

  /**
   *
   */
  get link() {
    const base = `${window.location.origin}/~/${this.params.teamSlug}`;
    if (!isElementParams(this.params)) {
      return (
        `${base}/${this.params.srcSuiteSlug}` +
        `?v=${this.params.srcBatchSlug}` +
        `&cv=${this.params.dstBatchSlug}`
      );
    }
    return (
      `${base}/${this.params.srcSuiteSlug}/${this.params.srcElementSlug}` +
      `?v=${this.params.srcBatchSlug}` +
      `&cv=${this.params.dstBatchSlug}`
    );
  }

  /**
   *
   */
  public onCopy(event: IClipboardResponse) {
    this.notificationService.notify(
      AlertType.Success,
      'Copied value to clipboard.'
    );
  }
}
