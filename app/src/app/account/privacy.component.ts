/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-account-privacy',
  templateUrl: './privacy.component.html'
})
export class PrivacyComponent {
  notes: string[] = [
    'We will never share your personal information with anyone.',
    'Our free plan will always remain free for everyone.',
    'Once you sign up, you can explore Touca in action using the sample test results in our playground.',
    'If you have any questions, we will always be one click or video call away to help you.'
  ];
}
