/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';

export interface TestimonialInput {
  image: string;
  title: string;
  subtitle: string;
  quote: string;
  learnMore: {
    title: string;
    text: string;
    link: string;
    hidden: boolean;
  };
}

@Component({
  selector: 'wsl-landing-testimonial',
  templateUrl: './testimonial.component.html'
})
export class TestimonialComponent {
  @Input() data: TestimonialInput;
}
