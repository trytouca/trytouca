// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, Input } from '@angular/core';

import type { PromotionItem } from '@/core/models/frontendtypes';

@Component({
  selector: 'app-suite-item-promotion',
  templateUrl: './promotion.component.html'
})
export class SuiteItemPromotionComponent {
  /**
   *
   */
  @Input() item: PromotionItem;
}
