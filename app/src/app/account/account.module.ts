// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '@/shared';

import { AccountRoutingModule } from './account-routing.module';
import { ActivateComponent } from './activate.component';
import { InstallComponent } from './install.component';
import { MailboxComponent } from './mailbox.component';
import { OnboardComponent } from './onboard.component';
import { ProfileComponent } from './profile.component';
import { ResetComponent } from './reset.component';
import { ResetApplyComponent } from './reset-apply.component';
import { ResetStartComponent } from './reset-start.component';
import { SettingsTabAuditComponent } from './settings/audit.component';
import { SettingsTabProfileComponent } from './settings/profile.component';
import { SettingsTabServerComponent } from './settings/server.component';
import { SettingsTabSessionsComponent } from './settings/sessions.component';
import { SettingsTabUsersComponent } from './settings/users.component';
import { SigninComponent } from './signin.component';
import { SignupComponent } from './signup.component';
import { StartComponent } from './start.component';

@NgModule({
  declarations: [
    ActivateComponent,
    InstallComponent,
    MailboxComponent,
    OnboardComponent,
    ProfileComponent,
    ResetComponent,
    ResetApplyComponent,
    ResetStartComponent,
    SigninComponent,
    SignupComponent,
    StartComponent,
    SettingsTabAuditComponent,
    SettingsTabProfileComponent,
    SettingsTabServerComponent,
    SettingsTabSessionsComponent,
    SettingsTabUsersComponent
  ],
  imports: [AccountRoutingModule, CommonModule, SharedModule]
})
export class AccountModule {}
