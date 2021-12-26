// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '@ngneat/dialog';
import { isEqual } from 'lodash-es';
import { Subscription, timer } from 'rxjs';

import type {
  SuiteLookupResponse,
  TeamLookupResponse
} from '@/core/models/commontypes';
import { ETeamRole } from '@/core/models/commontypes';
import { ApiService } from '@/core/services';
import {
  ConfirmComponent,
  ConfirmElements
} from '@/home/components/confirm.component';
import { Alert, AlertType } from '@/shared/components/alert.component';

import { SuitePageService, SuitePageTabType } from './suite.service';

interface IFormContent {
  name: string;
  slug: string;
  retainFor: number;
  sealAfter: number;
}

enum EModalType {
  ChangeName = 'changeSuiteName',
  ChangeSlug = 'changeSuiteSlug',
  ChangeRetainFor = 'changeSuiteRetainFor',
  ChangeSealAfter = 'changeSuiteSealAfter',
  DeleteSuite = 'deleteSuite'
}

@Component({
  selector: 'app-suite-tab-settings',
  templateUrl: './settings.component.html'
})
export class SuiteTabSettingsComponent implements OnDestroy {
  protected submitted: boolean;
  public formName: FormGroup;
  public formSlug: FormGroup;
  public formRetainFor: FormGroup;
  public formSealAfter: FormGroup;
  private _subTeam: Subscription;
  private _subSuite: Subscription;
  alert: Partial<Record<EModalType, Alert>> = {};
  team: TeamLookupResponse;
  suite: SuiteLookupResponse;
  ETeamRole = ETeamRole;
  EModalType = EModalType;

  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private suitePageService: SuitePageService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this._subTeam = this.suitePageService.data.team$.subscribe((team) => {
      this.team = team;
    });
    this._subSuite = this.suitePageService.data.suite$.subscribe((suite) => {
      this.suite = suite;
      this.formName.setValue({ name: suite.suiteName });
      this.formSlug.setValue({ slug: suite.suiteSlug });
      this.formRetainFor.setValue({
        retainFor: (suite.retainFor / 86400 / 30).toFixed(2)
      });
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
          Validators.pattern('[a-zA-Z][a-zA-Z0-9-]+')
        ],
        updateOn: 'blur'
      })
    });
    this.formRetainFor = new FormGroup({
      retainFor: new FormControl('', {
        validators: [
          Validators.required,
          Validators.max(60),
          Validators.min(0.1)
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

  ngOnDestroy() {
    this._subTeam.unsubscribe();
    this._subSuite.unsubscribe();
  }

  onSubmit(type: EModalType, model: IFormContent) {
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

  openConfirmModal(type: EModalType) {
    const elements = new Map<EModalType, ConfirmElements>([
      [
        EModalType.DeleteSuite,
        {
          title: `Delete Suite ${this.suite.suiteName}`,
          message:
            `<p>You are about to delete suite <strong>${this.suite.suiteName}</strong>.` +
            ' This action permanently removes all data associated with this suite.' +
            ' Are you sure you want to delete this suite?</p>',
          button: 'Delete',
          severity: AlertType.Danger,
          confirmText: `${this.suite.teamSlug}/${this.suite.suiteSlug}`,
          confirmAction: () => {
            const url = [
              'suite',
              this.suite.teamSlug,
              this.suite.suiteSlug
            ].join('/');
            return this.apiService.delete(url);
          },
          onActionSuccess: () => {
            this.router.navigate(['..'], { relativeTo: this.route });
          },
          onActionFailure: (err: HttpErrorResponse) => this.extractError(err)
        }
      ]
    ]);
    if (!elements.has(type)) {
      return;
    }
    this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: elements.get(type),
      minHeight: '10vh'
    });
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    event.stopImmediatePropagation();
  }

  private extractError(err: HttpErrorResponse) {
    return this.apiService.extractError(err, [
      [400, 'request invalid', 'Your request was rejected by the server.'],
      [
        401,
        'auth failed',
        'Your authorization key has expired. Please sign in again.'
      ],
      [
        403,
        'insufficient privileges',
        'You must be the owner of this team to perform this operation.'
      ],
      [404, 'team not found', 'This team has been removed.'],
      [
        409,
        'suite already registered',
        'This team already has a suite with this slug.'
      ]
    ]);
  }

  private updateSuiteName(name: string): void {
    const url = ['suite', this.suite.teamSlug, this.suite.suiteSlug].join('/');
    this.apiService.patch(url, { name }).subscribe({
      next: () => {
        this.alert.changeSuiteName = {
          type: AlertType.Success,
          text: 'Suite name was updated.'
        };
        timer(5000).subscribe(() => (this.alert.changeSuiteName = undefined));
        this.suitePageService.updateSuiteSlug(
          SuitePageTabType.Settings,
          this.suite.suiteSlug
        );
      },
      error: (err: HttpErrorResponse) => {
        this.alert.changeSuiteName = {
          type: AlertType.Danger,
          text: this.extractError(err)
        };
      }
    });
  }

  private updateSuiteSlug(slug: string): void {
    const url = ['suite', this.suite.teamSlug, this.suite.suiteSlug].join('/');
    this.apiService.patch(url, { slug }).subscribe({
      next: () => {
        this.alert.changeSuiteSlug = {
          type: AlertType.Success,
          text: 'Suite slug was updated.'
        };
        timer(5000).subscribe(() => (this.alert.changeSuiteSlug = undefined));
        this.suitePageService.updateSuiteSlug(SuitePageTabType.Settings, slug);
        this.router.navigate(['~', this.suite.teamSlug, slug]);
      },
      error: (err: HttpErrorResponse) => {
        this.alert.changeSuiteSlug = {
          type: AlertType.Danger,
          text: this.extractError(err)
        };
      }
    });
  }

  private updateSuiteRetainFor(retainFor: number): void {
    const url = ['suite', this.suite.teamSlug, this.suite.suiteSlug].join('/');
    this.apiService.patch(url, { retainFor }).subscribe({
      next: () => {
        this.alert.changeSuiteRetainFor = {
          type: AlertType.Success,
          text: 'Data retention duration was updated.'
        };
        timer(5000).subscribe(
          () => (this.alert.changeSuiteRetainFor = undefined)
        );
        this.suitePageService.updateSuiteSlug(
          SuitePageTabType.Settings,
          this.suite.suiteSlug
        );
      },
      error: (err: HttpErrorResponse) => {
        this.alert.changeSuiteRetainFor = {
          type: AlertType.Danger,
          text: this.extractError(err)
        };
      }
    });
  }

  private updateSuiteSealAfter(sealAfter: number): void {
    const url = ['suite', this.suite.teamSlug, this.suite.suiteSlug].join('/');
    this.apiService.patch(url, { sealAfter }).subscribe({
      next: () => {
        this.alert.changeSuiteSealAfter = {
          type: AlertType.Success,
          text: 'Auto seal duration was updated.'
        };
        timer(5000).subscribe(
          () => (this.alert.changeSuiteSealAfter = undefined)
        );
        this.suitePageService.updateSuiteSlug(
          SuitePageTabType.Settings,
          this.suite.suiteSlug
        );
      },
      error: (err: HttpErrorResponse) => {
        this.alert.changeSuiteSealAfter = {
          type: AlertType.Danger,
          text: this.extractError(err)
        };
      }
    });
  }
}
