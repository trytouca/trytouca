/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

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
      { path: '', redirectTo: 'signin', pathMatch: 'full' },
      { path: 'activate', component: ActivateComponent },
      { path: 'welcome', component: OnboardComponent },
      { path: 'signin', component: StartComponent, data: { page: 'signin' } },
      { path: 'signup', component: StartComponent, data: { page: 'signup' } },
      { path: 'reset', component: StartComponent, data: { page: 'reset' } }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule {}
