/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AlertService,
  ApiService,
  AuthService,
  NotificationService,
  UserService
} from './services';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    AlertService,
    ApiService,
    AuthService,
    NotificationService,
    UserService
  ]
})
export class CoreModule {}
