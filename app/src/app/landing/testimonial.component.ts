/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';

export interface TestimonialInput {
  image: string;
  title: string;
  subtitle: string;
  quote: string;
  learnMore: Record<'title' | 'text' | 'link', string>;
}

@Component({
  selector: 'wsl-landing-testimonial',
  templateUrl: './testimonial.component.html'
})
export class TestimonialComponent {
  @Input() data: TestimonialInput;
}
