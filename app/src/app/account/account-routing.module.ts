/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from '@weasel/core/services/auth-guard.service';
import { ActivateComponent } from './activate.component';
import { OnboardComponent } from './onboard.component';
import { StartComponent } from './start.component';

/**
 *
 */
const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'signup', pathMatch: 'full' },
      { path: 'activate', component: ActivateComponent },
      { path: 'signin', component: StartComponent, data: { page: 'signin' } },
      { path: 'signup', component: StartComponent, data: { page: 'signup' } },
      { path: 'reset', component: StartComponent, data: { page: 'reset' } },
      {
        path: 'welcome',
        component: OnboardComponent,
        canActivate: [AuthGuardService]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule {}
