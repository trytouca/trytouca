// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { provideDialogConfig } from '@ngneat/dialog';
import { CookieService } from 'ngx-cookie-service';

import { environment } from '../environments/environment';
import { AccountModule } from './account/account.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { FeedbackComponent } from './feedback/feedback.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [AppComponent, FeedbackComponent, NotfoundComponent],
  imports: [
    AppRoutingModule,
    BrowserModule,
    AccountModule,
    CoreModule,
    SharedModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [CookieService, provideDialogConfig({})],
  bootstrap: [AppComponent]
})
export class AppModule {}
