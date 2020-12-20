/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MarkdownModule } from 'ngx-markdown';

import { DocsComponent } from './docs.component';
import { DocsRoutingModule } from './docs-routing.module';
import { SharedModule } from '../shared';

@NgModule({
  imports: [
    CommonModule,
    DocsRoutingModule,
    MarkdownModule.forRoot(),
    SharedModule,
  ],
  declarations: [
    DocsComponent,
  ]
})
export class DocsModule { }
