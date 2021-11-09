// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="bg-transparent">
      <div
        class="container flex items-center justify-center h-16 mx-auto text-center"
      >
        <p class="text-sm leading-4 text-sky-800">
          &copy; {{ today | date: 'yyyy' }} Touca, Inc.
        </p>
      </div>
    </footer>
  `
})
export class FooterComponent {
  today: number = Date.now();
}
