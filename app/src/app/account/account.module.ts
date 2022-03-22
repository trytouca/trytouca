// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '@/shared';

import { AccountRoutingModule } from './account-routing.module';
import { ActivateComponent } from './activate.component';
import { MailboxComponent } from './mailbox.component';
import { OnboardComponent } from './onboard.component';
import { ProfileComponent } from './profile.component';
import { ResetComponent } from './reset.component';
import { ResetApplyComponent } from './reset-apply.component';
import { ResetStartComponent } from './reset-start.component';
import { SigninComponent } from './signin.component';
import { SignupComponent } from './signup.component';
import { StartComponent } from './start.component';

@NgModule({
  declarations: [
    ActivateComponent,
    MailboxComponent,
    OnboardComponent,
    ProfileComponent,
    ResetComponent,
    ResetApplyComponent,
    ResetStartComponent,
    SigninComponent,
    SignupComponent,
    StartComponent
  ],
  imports: [AccountRoutingModule, CommonModule, SharedModule]
})
export class AccountModule {}
