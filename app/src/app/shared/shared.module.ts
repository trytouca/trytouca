/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GoogleTagManagerModule } from 'angular-google-tag-manager';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DialogModule } from '@ngneat/dialog';
import {
  AlertComponent,
  FooterInsideComponent,
  HeaderInsideComponent,
  HeaderOutsideComponent,
  ServerDownComponent
} from './components';
import { environment } from '../../environments/environment';
import { AutofocusDirective, DropdownDirective } from './directives';

@NgModule({
  imports: [
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    GoogleTagManagerModule.forRoot({ id: environment.gtm_id }),
    HttpClientModule,
    DialogModule.forRoot(),
    ReactiveFormsModule,
    RouterModule
  ],
  declarations: [
    AlertComponent,
    AutofocusDirective,
    DropdownDirective,
    FooterInsideComponent,
    HeaderInsideComponent,
    HeaderOutsideComponent,
    ServerDownComponent
  ],
  exports: [
    AlertComponent,
    AutofocusDirective,
    CommonModule,
    DialogModule,
    DropdownDirective,
    FontAwesomeModule,
    FooterInsideComponent,
    FormsModule,
    GoogleTagManagerModule,
    HeaderInsideComponent,
    HeaderOutsideComponent,
    HttpClientModule,
    ReactiveFormsModule,
    ServerDownComponent
  ]
})
export class SharedModule {}
