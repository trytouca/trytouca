/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@weasel/shared';
import { AccountRoutingModule } from './account-routing.module';
import { ActivateComponent } from './activate.component';
import { OnboardComponent } from './onboard.component';
import { StartComponent } from './start.component';
import { FeatureComponent } from './feature.component';
import { PrivacyComponent } from './privacy.component';
import { SigninComponent } from './signin.component';
import { SignupComponent } from './signup.component';

@NgModule({
  declarations: [
    ActivateComponent,
    OnboardComponent,
    StartComponent,
    FeatureComponent,
    PrivacyComponent,
    SigninComponent,
    SignupComponent
  ],
  imports: [AccountRoutingModule, CommonModule, SharedModule]
})
export class AccountModule {}
