/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '@weasel/core/services';
import { FeedbackComponent } from './feedback/feedback.component';
import { LandingComponent } from './landing/landing.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ActivateComponent, ResetComponent } from './auth';

const routes: Routes = [
  { path: '', component: LandingComponent, data: { page: 'landing' } },
  { path: 'activate', component: ActivateComponent },
  { path: 'reset', component: ResetComponent, data: { page: 'reset' } },
  {
    path: 'feedback',
    component: FeedbackComponent,
    data: { page: 'feedback' }
  },
  {
    path: 'account',
    loadChildren: () =>
      import('./account/account.module').then((m) => m.AccountModule),
    data: { page: 'account' }
  },
  {
    path: 'docs',
    loadChildren: () => import('./docs/docs.module').then((m) => m.DocsModule),
    data: { page: 'docs', title: 'Docs' }
  },
  {
    canActivate: [AuthGuardService],
    path: '~',
    loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
    data: { page: 'home', title: 'Home' }
  },
  { path: '**', component: NotfoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
