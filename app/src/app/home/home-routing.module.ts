// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home.component';
import { BatchPageComponent } from './pages/batch';
import { ElementPageComponent } from './pages/element';
import { SuitePageComponent } from './pages/suite';
import { TeamPageComponent } from './pages/team';

/**
 *
 */
const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: '', component: TeamPageComponent },
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
