/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-footer-inside',
  templateUrl: './footer-inside.component.html'
})
export class FooterInsideComponent {
  today: number = Date.now();
}
