// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

/* eslint-disable @typescript-eslint/no-unsafe-call */

import { UserLookupResponse } from '@touca/api-schema';
import { environment } from 'src/environments/environment';

class IntercomClient {
  public get enabled() {
    return environment.production;
  }
  public load() {
    if (!this.enabled) {
      return;
    }
    (window as any).HubSpotConversations?.widget.load();
    (window as any).HubSpotConversations?.widget.open();
  }
  public remove() {
    if (!this.enabled) {
      return;
    }
    (window as any).HubSpotConversations?.widget.close();
    (window as any).HubSpotConversations?.widget.remove();
  }
  public setUser(user: UserLookupResponse) {
    if (!this.enabled) {
      return;
    }
    (window as any).hsConversationsSettings = {
      identificationEmail: user.email,
      identificationToken: user.user_hash,
      inlineEmbedSelector: '#chat-box'
    };
  }
}

export const intercomClient = new IntercomClient();
