/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DocsComponent } from './docs.component';

const routes: Routes = [
  {
    path: '',
    component: DocsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocsRoutingModule { }
