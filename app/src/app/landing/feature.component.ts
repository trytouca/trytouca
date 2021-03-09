/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface FeatureInput {
  colors: string[];
  icon: string;
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
  data: FeatureInput;
  svg: SafeHtml;

  @Input() set input(input: FeatureInput) {
    this.data = input;
    this.svg = this.sanitizer.bypassSecurityTrustHtml(input.icon);
  }

  constructor(private sanitizer: DomSanitizer) {}
}
