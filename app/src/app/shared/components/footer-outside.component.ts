/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faGithub, faSlack, faTwitter } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-footer-outside',
  templateUrl: './footer-outside.component.html',
  styleUrls: ['./footer-outside.component.scss']
})
export class FooterOutsideComponent {
  today: number = Date.now();
  links = {
    github: environment.profileGithub,
    twitter: environment.profileTwitter,
    slack: environment.profileTwitter
  };

  /**
   *
   */
  constructor(
    private faIconLibrary: FaIconLibrary
  ) {
    faIconLibrary.addIcons(faGithub, faSlack, faTwitter);
  }

}
