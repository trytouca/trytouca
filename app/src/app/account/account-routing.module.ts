// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { environment } from 'src/environments/environment';

import { AuthGuard, GuestGuard, InstallGuard } from '@/core/services';

import { ActivateComponent } from './activate.component';
import { InstallComponent } from './install.component';
import { OnboardComponent } from './onboard.component';
import { ProfileComponent } from './profile.component';
import { StartComponent, StartPageType } from './start.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: environment.self_hosted ? 'signin' : 'signup',
        pathMatch: 'full'
      },
      {
        path: '',
        canActivateChild: [InstallGuard],
        children: [
          {
            path: 'install',
            component: InstallComponent
          }
        ]
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
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule {}
