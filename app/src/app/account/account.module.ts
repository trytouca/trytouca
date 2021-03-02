/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@weasel/shared';
import { AccountRoutingModule } from './account-routing.module';
import { ActivateComponent } from './activate.component';
import { FeatureComponent } from './feature.component';
import { MailboxComponent } from './mailbox.component';
import { OnboardComponent } from './onboard.component';
import { PrivacyComponent } from './privacy.component';
import { ResetComponent } from './reset.component';
import { ResetApplyComponent } from './reset-apply.component';
import { ResetStartComponent } from './reset-start.component';
import { SigninComponent } from './signin.component';
import { SignupComponent } from './signup.component';
import { StartComponent } from './start.component';

@NgModule({
  declarations: [
    ActivateComponent,
    FeatureComponent,
    MailboxComponent,
    OnboardComponent,
    PrivacyComponent,
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
