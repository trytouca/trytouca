/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard, GuestGuard } from '@weasel/core/services';
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
      {
        path: '',
        redirectTo: 'signup',
        pathMatch: 'full'
      },
      {
        path: 'activate',
        canActivate: [GuestGuard],
        component: ActivateComponent
      },
      {
        path: 'signin',
        canActivate: [GuestGuard],
        component: StartComponent,
        data: { page: StartPageType.Signin }
      },
      {
        path: 'signup',
        canActivate: [GuestGuard],
        component: StartComponent,
        data: { page: StartPageType.Signup }
      },
      {
        path: 'reset',
        canActivate: [GuestGuard],
        component: StartComponent,
        data: { page: StartPageType.Reset }
      },
      {
        path: 'welcome',
        canActivate: [AuthGuard],
        component: OnboardComponent
      },
      {
        path: 'profile',
        canActivate: [AuthGuard],
        component: OnboardComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule {}
