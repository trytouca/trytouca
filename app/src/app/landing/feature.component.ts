/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';

export interface FeatureInput {
  colors: string[];
  images: Record<'alt' | 'link' | 'src' | 'title', string>[];
  features: Record<'title' | 'detail', string>[];
  learnMore: Record<'link' | 'title', string>;
  title: string;
}

@Component({
  selector: 'wsl-landing-feature',
  templateUrl: './feature.component.html'
})
export class FeatureComponent {
  @Input() data: FeatureInput;
}
