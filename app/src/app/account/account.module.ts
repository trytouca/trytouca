/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountRoutingModule } from './account-routing.module';
import { ActivateComponent } from './activate.component';
import { OnboardComponent } from './onboard.component';
import { StartComponent } from './start.component';

@NgModule({
  declarations: [ActivateComponent, OnboardComponent, StartComponent],
  imports: [AccountRoutingModule, CommonModule]
})
export class AccountModule {}
