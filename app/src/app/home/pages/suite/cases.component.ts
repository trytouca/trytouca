// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ElementListResponse } from '@/core/models/commontypes';

import { SuitePageService } from './suite.service';

@Component({
  selector: 'app-suite-tab-cases',
  templateUrl: './cases.component.html'
})
export class SuiteTabCasesComponent implements OnDestroy {
  private _subElements: Subscription;
  elements: ElementListResponse;

  constructor(private suitePageService: SuitePageService) {
    this._subElements = suitePageService.data.elements$.subscribe((v) => {
      this.elements = v;
    });
  }

  ngOnDestroy() {
    this._subElements.unsubscribe();
  }
}
