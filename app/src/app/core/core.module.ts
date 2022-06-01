// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

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
