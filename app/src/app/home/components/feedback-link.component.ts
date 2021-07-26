/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-home-feedback-link',
  template: `
    <div
      class="container mx-auto px-4 h-12 flex flex-col justify-center"
      *ngIf="message"
    >
      <p class="wsl-text-muted text-sm text-right">
        <a [routerLink]="['/feedback']" [queryParams]="queryParams">
          {{ message }}
        </a>
      </p>
    </div>
  `
})
export class FeedbackLinkComponent implements OnInit {
  queryParams: { page: string } = { page: null };
  _message: string;
  _messages = [
    'What feature is missing from this page?',
    'What else would you like to see on this page?',
    'Do you have a minute to tell us how to improve this page?',
    'Do you have a minute to give us some feedback about this page?'
  ];

  ngOnInit() {
    if (Math.random() < 0.05) {
      const index = Math.floor(+new Date() / 8.64e7) % this._messages.length;
      this._message = this._messages[index];
    }
  }

  @Input()
  set page(name: string) {
    this.queryParams = { page: name };
  }

  public get message() {
    return this._message;
  }
}
