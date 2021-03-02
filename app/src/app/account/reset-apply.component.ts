/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';

export interface IAccountInfo {
  email: string;
  fullname: string;
  username: string;
  resetKey: string;
}

@Component({
  selector: 'wsl-account-reset-apply',
  templateUrl: './reset-apply.component.html'
})
export class ResetApplyComponent {
  @Input() input: IAccountInfo;
}
