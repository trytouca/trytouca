// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { environment } from 'src/environments/environment';

import { intercomClient } from '@/shared/utils/intercom';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styles: [
    `
      .wsl-help-dropdown-menu {
        @apply fixed;
      }
    `
  ]
})
export class HelpComponent {
  faDiscord = faDiscord;
  version = environment.appVersion;
  isChatWidgetOpen = false;

  constructor(faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIcons(faDiscord);
  }
  hasIntercom() {
    return intercomClient.enabled;
  }
  openChatWidget() {
    intercomClient.load();
    this.isChatWidgetOpen = true;
  }
  closeChatWidgetIfOpen() {
    if (this.isChatWidgetOpen) {
      intercomClient.remove();
      this.isChatWidgetOpen = false;
    }
  }
}
