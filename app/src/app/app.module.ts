/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { AccountModule } from './account/account.module';
import { FeatureComponent } from './landing/feature.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { LandingComponent } from './landing/landing.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { PricingComponent } from './pricing/pricing.component';
import { PricingPlanComponent } from './pricing/plan.component';
import { SharedModule } from './shared/shared.module';
import { TestimonialComponent } from './landing/testimonial.component';

@NgModule({
  declarations: [
    AppComponent,
    FeatureComponent,
    FeedbackComponent,
    LandingComponent,
    NotfoundComponent,
    PricingComponent,
    PricingPlanComponent,
    TestimonialComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    AccountModule,
    CoreModule,
    SharedModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
