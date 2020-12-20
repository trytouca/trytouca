/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import {
  FooterInsideComponent,
  FooterOutsideComponent,
  HeaderInsideComponent,
  HeaderOutsideComponent,
  ServerDownComponent
} from './components';

import {
  SignupFormComponent
} from './forms/signup.component';

@NgModule({
  imports: [
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    ReactiveFormsModule,
    RouterModule
  ],
  declarations: [
    FooterInsideComponent,
    FooterOutsideComponent,
    HeaderInsideComponent,
    HeaderOutsideComponent,
    ServerDownComponent,
    SignupFormComponent,
  ],
  exports: [
    CommonModule,
    FontAwesomeModule,
    FooterInsideComponent,
    FooterOutsideComponent,
    FormsModule,
    HeaderInsideComponent,
    HeaderOutsideComponent,
    HttpClientModule,
    NgbModule,
    ReactiveFormsModule,
    ServerDownComponent,
    SignupFormComponent
  ]
})

export class SharedModule {}
