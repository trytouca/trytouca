// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';

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
  isChatWidgetOpen = false;
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
