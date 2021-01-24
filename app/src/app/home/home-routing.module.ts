/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home.component';
import { TeamsPageComponent } from './pages/teams';
import { TeamPageComponent } from './pages/team';
import { SuitePageComponent } from './pages/suite';
import { BatchPageComponent } from './pages/batch';
import { ElementPageComponent } from './pages/element';

/**
 *
 */
const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: '', component: TeamsPageComponent },
      { path: ':team', component: TeamPageComponent },
      { path: ':team/:suite', component: SuitePageComponent },
      { path: ':team/:suite/:batch', component: BatchPageComponent },
      { path: ':team/:suite/:batch/:element', component: ElementPageComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule {}
