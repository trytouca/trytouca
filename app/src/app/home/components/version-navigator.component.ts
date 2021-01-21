/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import type { SuiteLookupResponse, Promotion } from '@weasel/core/models/commontypes';
import type { FrontendBatchCompareParams, FrontendElementCompareParams } from '@weasel/core/models/frontendtypes';
import { NotificationService } from '@weasel/core/services';
import { AlertType } from '@weasel/shared/components/alert.component';

type ParamsType = FrontendBatchCompareParams | FrontendElementCompareParams;

@Component({
  selector: 'app-home-version-navigator',
  templateUrl: './version-navigator.component.html'
})
export class VersionNavigatorComponent {

  faLink = faLink;

  @Input() suite: SuiteLookupResponse;
  @Input() params: ParamsType;

  /**
   *
   */
  constructor(private notificationService: NotificationService) {
  }

  /**
   *
   */
  private isElementParams(type: ParamsType): type is FrontendElementCompareParams {
    return 'srcElementSlug' in type;
  }

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
    if (!this.isElementParams(this.params)) {
      return `${base}/${this.params.srcSuiteSlug}`
        + `?v=${this.params.srcBatchSlug}`
        + `&cv=${this.params.dstBatchSlug}`;
    }
    return `${base}/${this.params.srcSuiteSlug}/${this.params.srcElementSlug}`
      + `?v=${this.params.srcBatchSlug}`
      + `&cv=${this.params.dstBatchSlug}`;
  }

  /**
   *
   */
  public onCopy(event: string) {
    this.notificationService.notify(AlertType.Success, 'Copied value to clipboard.');
  }

}
