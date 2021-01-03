/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuardService } from 'src/app/core/services';
import { FeedbackComponent } from './feedback/feedback.component';
import { LandingComponent } from './landing/landing.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ActivateComponent, ResetComponent, SigninComponent, SignupComponent } from './auth';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'activate', component: ActivateComponent },
  { path: 'feedback', component: FeedbackComponent },
  { path: 'reset', component: ResetComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'docs',
    loadChildren: () => import('./docs/docs.module').then(m => m.DocsModule),
    data: { title: 'Docs' }
  },
  {
    canActivate: [AuthGuardService],
    path: '~',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
    data: { title: 'Home' }
  },
  { path: '**', component: NotfoundComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }) ],
  exports: [
    RouterModule
  ]
})

export class AppRoutingModule { }
