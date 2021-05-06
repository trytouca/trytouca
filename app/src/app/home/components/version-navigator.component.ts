/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';
import { IClipboardResponse } from 'ngx-clipboard';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import type {
  SuiteLookupResponse,
  Promotion
} from '@weasel/core/models/commontypes';
import { NotificationService } from '@weasel/core/services';
import { AlertType } from '@weasel/shared/components/alert.component';
import {
  isElementParams,
  FrontendVersionListParamsType
} from '@weasel/home/components/version-list.component';

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
