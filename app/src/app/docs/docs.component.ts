/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faBook,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

type InternalPage = { link: string; name: string; docs: string[] };

@Component({
  selector: 'app-page-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.scss']
})
export class DocsComponent implements OnDestroy {
  readonly internalPages: InternalPage[] = [
    { link: 'intro', name: 'Introduction', docs: ['Introduction.md'] },
    { link: 'basics', name: 'Basic Terms', docs: ['BasicTerms.md'] },
    {
      link: 'quickstart',
      name: 'Getting Started',
      docs: ['Quickstart_Cpp.md']
    },
    { link: 'tips', name: 'Best Practices', docs: ['BestPractices.md'] },
    { link: 'faq', name: 'FAQ', docs: ['Faq.md'] }
  ];

  readonly hiddenPages: InternalPage[] = [
    { link: 'terms', name: 'Terms of Service', docs: ['TermsOfService.md'] },
    { link: 'privacy', name: 'Privacy Policy', docs: ['PrivacyPolicy.md'] }
  ];

  readonly externalPages: { name: string; path: string }[] = [
    { name: 'C++ Client API', path: '/docs/clients/cpp/index.html' },
    { name: 'Platform API', path: '/docs/backend/index.html' },
    { name: 'Product Roadmap', path: 'http://bit.ly/3ap39n7' }
  ];

  private _subQueryParamMap: Subscription;
  currentPage: InternalPage;
  previousPage: InternalPage;
  nextPage: InternalPage;

  constructor(
    private faIconLibrary: FaIconLibrary,
    private router: Router,
    private route: ActivatedRoute
  ) {
    faIconLibrary.addIcons(
      faAngleDoubleLeft,
      faAngleDoubleRight,
      faBook,
      faExternalLinkAlt
    );
    this._subQueryParamMap = this.route.queryParamMap.subscribe((map) => {
      const pages = [...this.internalPages, ...this.hiddenPages];
      const valid = pages.map((v) => v.link);
      const link =
        map.has('page') && valid.includes(map.get('page'))
          ? map.get('page')
          : 'quickstart';
      const index = pages.findIndex((v) => v.link === link);
      this.currentPage = pages[index];
      this.previousPage = index === 0 ? null : pages[index - 1];
      this.nextPage = index === pages.length - 1 ? null : pages[index + 1];
    });
  }

  ngOnDestroy() {
    this._subQueryParamMap.unsubscribe();
  }

  switchToPage(link: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: link },
      queryParamsHandling: 'merge'
    });
  }

  launchExternalPage(name: string): void {
    const path = this.externalPages.find((v) => v.name === name).path;
    const url = path.startsWith('http')
      ? path
      : this.router.serializeUrl(this.router.createUrlTree([path]));
    if (environment.production) {
      window.open(url, '_blank');
    }
  }
}
