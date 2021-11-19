// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { intercomClient } from '@/shared/utils/intercom';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent {
  isChatWidgetOpen = false;
  isCloudHosted() {
    return environment.production;
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
