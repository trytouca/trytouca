/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';
import type { PromotionItem } from 'src/app/core/models/frontendtypes';

@Component({
  selector: 'app-suite-item-promotion',
  templateUrl: './promotion.component.html',
  styleUrls: ['./promotion.component.scss']
})
export class SuiteItemPromotionComponent {

  /**
   *
   */
  @Input() item: PromotionItem;

}
