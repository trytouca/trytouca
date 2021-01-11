/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy, HostListener } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { isEqual } from 'lodash-es';
import { Subscription, timer } from 'rxjs';
import { ApiService } from '@weasel/core/services';
import { ETeamRole } from '@weasel/core/models/commontypes';
import type { SuiteLookupResponse, TeamLookupResponse } from '@weasel/core/models/commontypes';
import { SuitePageService, SuitePageTabType } from './suite.service';
import { ConfirmComponent, ConfirmElements } from '@weasel/home/components/confirm.component';

interface IFormContent {
  name: string;
  slug: string;
  retainFor: number;
  sealAfter: number;
}

enum AlertType {
  Success = 'alert-success',
  Danger = 'alert-danger'
}

type Alert = { type: AlertType, msg: string, close?: boolean };

enum EModalType {
  ChangeName = 'changeSuiteName',
  ChangeSlug = 'changeSuiteSlug',
  ChangeRetainFor = 'changeSuiteRetainFor',
  ChangeSealAfter = 'changeSuiteSealAfter',
  DeleteSuite = 'deleteSuite'
}

@Component({
  selector: 'app-suite-tab-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SuiteTabSettingsComponent implements OnDestroy {

  alert: Partial<Record<EModalType, Alert>> = {};

  protected submitted: boolean;
  public formName: FormGroup;
  public formSlug: FormGroup;
  public formRetainFor: FormGroup;
  public formSealAfter: FormGroup;

  team: TeamLookupResponse;
  suite: SuiteLookupResponse;

  private _confirmModalRef: NgbModalRef;
  private _subTeam: Subscription;
  private _subSuite: Subscription;

  ETeamRole = ETeamRole;
  EModalType = EModalType;

  /**
   *
   */
  constructor(
    private apiService: ApiService,
    private suitePageService: SuitePageService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal
  ) {
    this._subTeam = this.suitePageService.team$.subscribe(team => {
      this.team = team;
    });
    this._subSuite = this.suitePageService.suite$.subscribe(suite => {
      this.suite = suite;
      this.formName.setValue({ name: suite.suiteName });
      this.formSlug.setValue({ slug: suite.suiteSlug });
      this.formRetainFor.setValue({ retainFor: (suite.retainFor / 86400 / 30).toFixed(2) });
      this.formSealAfter.setValue({ sealAfter: suite.sealAfter / 60 });
    });
    this.formName = new FormGroup({
      name: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(32)
        ],
        updateOn: 'blur'
      })
    });
    this.formSlug = new FormGroup({
      slug: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(16),
          Validators.pattern('[a-zA-Z][a-zA-Z0-9\-]+')
        ],
        updateOn: 'blur'
      })
    });
    this.formRetainFor = new FormGroup({
      retainFor: new FormControl('', {
        validators: [
          Validators.required,
          Validators.max(60),
          Validators.min(0.1),
        ],
        updateOn: 'blur'
      })
    });
    this.formSealAfter = new FormGroup({
      sealAfter: new FormControl('', {
        validators: [
          Validators.required,
          Validators.max(30),
          Validators.min(0.1)
        ],
        updateOn: 'blur'
      })
    });
  }

  /**
   *
   */
  ngOnDestroy() {
    this._subTeam.unsubscribe();
    this._subSuite.unsubscribe();
  }

  /**
   *
   */
  async onSubmit(type: EModalType, model: IFormContent) {
    switch (type) {
      case EModalType.ChangeName:
        if (!this.formName.valid) {
          break;
        }
        if (isEqual(this.suite.suiteName, model.name)) {
          break;
        }
        this.updateSuiteName(model.name);
        break;

      case EModalType.ChangeSlug:
        if (!this.formSlug.valid) {
          break;
        }
        if (isEqual(this.suite.suiteSlug, model.slug)) {
          break;
        }
        this.updateSuiteSlug(model.slug);
        break;
      case EModalType.ChangeRetainFor:
        if (!this.formRetainFor.valid) {
          break;
        }
        if (isEqual(this.suite.retainFor / 86400 / 30, model.retainFor)) {
          break;
        }
        this.updateSuiteRetainFor(model.retainFor * 86400 * 30);
        break;
      case EModalType.ChangeSealAfter:
        if (!this.formSealAfter.valid) {
          break;
        }
        if (isEqual(this.suite.sealAfter / 60, model.sealAfter)) {
          break;
        }
        this.updateSuiteSealAfter(model.sealAfter * 60);
    }
    this.submitted = true;
  }

  /**
   *
   */
  async openConfirmModal(type: EModalType) {
    this._confirmModalRef = this.modalService.open(ConfirmComponent);
    if (type === EModalType.DeleteSuite) {
      const elements: ConfirmElements = {
        title: `Delete Suite ${this.suite.suiteName}`,
        message: `<p>
          You are about to delete suite <strong>${this.suite.suiteName}</strong>.
          This action permanently removes all data associated with this suite.
          Are you sure you want to delete this suite?</p>`,
        button: 'Delete'
      };
      this._confirmModalRef.componentInstance.elements = elements;
    }
    this._confirmModalRef.result
      .then((state: boolean) => {
        if (!state) {
          return;
        }
        switch (type) {
          case EModalType.DeleteSuite:
            return this.deleteSuite();
        }
      })
      .catch(_e => true);
  }

  /**
   *
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    event.stopImmediatePropagation();
  }

  /**
   *
   */
  private extractError(err: HttpErrorResponse) {
    return this.apiService.extractError(err, [
      [ 400, 'request invalid', 'Your request was rejected by the server.' ],
      [ 401, 'auth failed', 'Your authorization key has expired. Please sign in again.' ],
      [ 403, 'insufficient privileges', 'You must be the owner of this team to perform this operation.' ],
      [ 404, 'team not found', 'This team has been removed.' ],
      [ 409, 'team already registered', 'There is already a team with this slug.' ]
    ]);
  }

  /**
   *
   */
  private updateSuiteName(name: string): void {
    const url = [ 'suite', this.suite.teamSlug, this.suite.suiteSlug ].join('/');
    this.apiService.patch(url, { name }).subscribe(
      () => {
        this.alert.changeSuiteName = {
          type: AlertType.Success, msg: 'Suite name was updated.'
        };
        timer(5000).subscribe(() => this.alert.changeSuiteName.close = true);
        this.suitePageService.updateSuiteSlug(SuitePageTabType.Settings, this.suite.suiteSlug);
      },
      (err: HttpErrorResponse) => {
        this.alert.changeSuiteName = {
          type: AlertType.Danger, msg: this.extractError(err)
        };
      });
  }

  /**
   *
   */
  private updateSuiteSlug(slug: string): void {
    const url = [ 'suite', this.suite.teamSlug, this.suite.suiteSlug ].join('/');
    this.apiService.patch(url, { slug }).subscribe(
      () => {
        this.alert.changeSuiteSlug = {
          type: AlertType.Success, msg: 'Suite slug was updated.'
        };
        timer(5000).subscribe(() => this.alert.changeSuiteSlug.close = true);
        this.suitePageService.updateSuiteSlug(SuitePageTabType.Settings, slug);
        this.router.navigate([ '~', this.suite.teamSlug, slug ]);
      },
      (err: HttpErrorResponse) => {
        this.alert.changeSuiteSlug = {
          type: AlertType.Danger, msg: this.extractError(err)
        };
      });
  }

  /**
   *
   */
  private updateSuiteRetainFor(retainFor: number): void {
    const url = [ 'suite', this.suite.teamSlug, this.suite.suiteSlug ].join('/');
    this.apiService.patch(url, { retainFor }).subscribe(
      () => {
        this.alert.changeSuiteRetainFor = {
          type: AlertType.Success, msg: 'Data retention duration was updated.'
        };
        timer(5000).subscribe(() => this.alert.changeSuiteRetainFor.close = true);
        this.suitePageService.updateSuiteSlug(SuitePageTabType.Settings, this.suite.suiteSlug);
      },
      (err: HttpErrorResponse) => {
        this.alert.changeSuiteRetainFor = {
          type: AlertType.Danger, msg: this.extractError(err)
        };
      });
  }

  /**
   *
   */
  private updateSuiteSealAfter(sealAfter: number): void {
    const url = [ 'suite', this.suite.teamSlug, this.suite.suiteSlug ].join('/');
    this.apiService.patch(url, { sealAfter }).subscribe(
      () => {
        this.alert.changeSuiteSealAfter = {
          type: AlertType.Success, msg: 'Auto seal duration was updated.'
        };
        timer(5000).subscribe(() => this.alert.changeSuiteSealAfter.close = true);
        this.suitePageService.updateSuiteSlug(SuitePageTabType.Settings, this.suite.suiteSlug);
      },
      (err: HttpErrorResponse) => {
        this.alert.changeSuiteSealAfter = {
          type: AlertType.Danger, msg: this.extractError(err)
        };
      });
  }

  /**
   *
   */
  public deleteSuite() {
    const url = [ 'suite', this.suite.teamSlug, this.suite.suiteSlug ].join('/');
    this.apiService.delete(url).subscribe(
      () => {
        this.router.navigate(['..'], {relativeTo: this.route });
      },
      (err: HttpErrorResponse) => {
        this.alert.deleteSuite = {
          type: AlertType.Danger, msg: this.extractError(err)
        };
      });
  }

}
