/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import {
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';

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
export class FeatureComponent implements OnInit {
  @Input() data: FeatureInput;
  @ViewChild('featureSubmit', { static: true }) featureSubmit;
  @ViewChild('featureInterpret', { static: true }) featureInterpret;
  @ViewChild('featureCollaborate', { static: true }) featureCollaborate;
  @ViewChild('featureAutomate', { static: true }) featureAutomate;
  refs: Map<string, TemplateRef<any>>;
  getRef(feature: string): TemplateRef<any> {
    return this.refs.get(feature);
  }
  ngOnInit() {
    this.refs = new Map<string, TemplateRef<any>>([
      ['featureSubmit', this.featureSubmit],
      ['featureInterpret', this.featureInterpret],
      ['featureCollaborate', this.featureCollaborate],
      ['featureAutomate', this.featureAutomate]
    ]);
  }
}
