// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminGuard, AuthGuard, GuestGuard } from '@/core/services';

import { ActivateComponent } from './activate.component';
import { OnboardComponent } from './onboard.component';
import { PlatformComponent } from './platform.component';
import { ProfileComponent } from './profile.component';
import { StartComponent, StartPageType } from './start.component';

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
        path: '',
        canActivateChild: [GuestGuard],
        children: [
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
          }
        ]
      },
      {
        path: '',
        canActivateChild: [AuthGuard],
        children: [
          { path: 'profile', component: ProfileComponent },
          { path: 'welcome', component: OnboardComponent }
        ]
      },
      {
        path: '',
        canActivateChild: [AuthGuard, AdminGuard],
        children: [{ path: 'admin', component: PlatformComponent }]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule {}
