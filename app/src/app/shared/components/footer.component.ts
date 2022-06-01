// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="bg-transparent">
      <div
        class="container mx-auto flex h-16 items-center justify-center text-center">
        <p class="text-sm leading-4 text-sky-800 dark:text-gray-400">
          &copy; {{ today | date: 'yyyy' }} Touca, Inc.
        </p>
      </div>
    </footer>
  `
})
export class FooterComponent {
  today: number = Date.now();
}
