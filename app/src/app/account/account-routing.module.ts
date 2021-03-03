/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from '@weasel/core/services/auth-guard.service';
import { ActivateComponent } from './activate.component';
import { OnboardComponent } from './onboard.component';
import { StartComponent, StartPageType } from './start.component';

/**
 *
 */
const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'signup', pathMatch: 'full' },
      { path: 'activate', component: ActivateComponent },
      {
        path: 'signin',
        component: StartComponent,
        data: { page: StartPageType.Signin }
      },
      {
        path: 'signup',
        component: StartComponent,
        data: { page: StartPageType.Signup }
      },
      {
        path: 'reset',
        component: StartComponent,
        data: { page: StartPageType.Reset }
      },
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
