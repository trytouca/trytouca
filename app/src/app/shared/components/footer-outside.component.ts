/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faGithub,
  faSlack,
  faTwitter
} from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-footer-outside',
  templateUrl: './footer-outside.component.html'
})
export class FooterOutsideComponent {
  today: number = Date.now();
  social = [
    {
      title: 'Join our Community',
      link: 'https://getweasel.slack.com',
      icon: ['fab', 'slack']
    },
    {
      title: 'Follow us on Twitter',
      link: 'https://twitter.com/getweasel',
      icon: ['fab', 'twitter']
    },
    {
      title: 'Check us out on GitHub',
      link: 'https://github.com/getweasel',
      icon: ['fab', 'github']
    }
  ];

  /**
   *
   */
  constructor(private faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIcons(faGithub, faSlack, faTwitter);
  }
}
