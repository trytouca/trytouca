/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';

export interface PricingPlan {
  title: string;
  description: string;
  features: string[];
  fee?: number;
  button: {
    title: string;
    link: string;
  };
}

@Component({
  selector: 'wsl-page-pricing-plan',
  templateUrl: './plan.component.html',
  styles: []
})
export class PricingPlanComponent {
  @Input() plan: PricingPlan;
}
