// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '@/shared';

import { AccountRoutingModule } from './account-routing.module';
import { ActivateComponent } from './activate.component';
import { InstallComponent } from './install.component';
import { InstallAccountComponent } from './install/account.component';
import { InstallNameComponent } from './install/name.component';
import { InstallTelemetryComponent } from './install/telemetry.component';
import { InstallThanksComponent } from './install/thanks.component';
import { MailboxComponent } from './mailbox.component';
import { OnboardComponent } from './onboard.component';
import { ProfileComponent } from './profile.component';
import { ResetComponent } from './reset.component';
import { ResetApplyComponent } from './reset-apply.component';
import { ResetStartComponent } from './reset-start.component';
import { SettingsTabAuditComponent } from './settings/audit.component';
import { SettingsCheckboxComponent } from './settings/checkbox.component';
import { SettingsTabMailComponent } from './settings/mail.component';
import { SettingsTabPreferencesComponent } from './settings/preferences.component';
import { SettingsTabProfileComponent } from './settings/profile.component';
import { SettingsTabServerComponent } from './settings/server.component';
import { SettingsTabSessionsComponent } from './settings/sessions.component';
import { TelemetryComponent } from './settings/telemetry.component';
import { SettingsTabUsersComponent } from './settings/users.component';
import { SigninComponent } from './signin.component';
import { SignupComponent } from './signup.component';
import { StartComponent } from './start.component';

@NgModule({
  declarations: [
    ActivateComponent,
    InstallAccountComponent,
    InstallComponent,
    InstallNameComponent,
    InstallTelemetryComponent,
    InstallThanksComponent,
    MailboxComponent,
    OnboardComponent,
    ProfileComponent,
    ResetComponent,
    ResetApplyComponent,
    ResetStartComponent,
    SigninComponent,
    SignupComponent,
    StartComponent,
    SettingsCheckboxComponent,
    SettingsTabAuditComponent,
    SettingsTabMailComponent,
    SettingsTabPreferencesComponent,
    SettingsTabProfileComponent,
    SettingsTabServerComponent,
    SettingsTabSessionsComponent,
    SettingsTabUsersComponent,
    TelemetryComponent
  ],
  imports: [AccountRoutingModule, CommonModule, SharedModule]
})
export class AccountModule {}
