// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '@ngneat/dialog';
import { isEqual } from 'lodash-es';
import { Subscription, timer } from 'rxjs';

import { ETeamRole, TeamLookupResponse } from '@/core/models/commontypes';
import { ELocalStorageKey } from '@/core/models/frontendtypes';
import { ApiService } from '@/core/services';
import {
  ConfirmComponent,
  ConfirmElements
} from '@/home/components/confirm.component';
import { Alert, AlertType } from '@/shared/components/alert.component';

import { TeamPageService } from './team.service';

interface FormContent {
  name: string;
  slug: string;
}

enum EModalType {
  ChangeName = 'changeTeamName',
  ChangeSlug = 'changeTeamSlug',
  LeaveTeam = 'leaveTeam',
  DeleteTeam = 'deleteTeam'
}

@Component({
  selector: 'app-team-tab-settings',
  templateUrl: './settings.component.html'
})
export class TeamTabSettingsComponent implements OnDestroy {
  alert: Partial<Record<EModalType, Alert>> = {};

  protected submitted: boolean;
  public formName: FormGroup;
  public formSlug: FormGroup;

  team: TeamLookupResponse;

  private _subTeam: Subscription;

  ETeamRole = ETeamRole;
  EModalType = EModalType;

  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private teamPageService: TeamPageService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this._subTeam = this.teamPageService.data.team$.subscribe((team) => {
      this.team = team;
      this.formName.setValue({ name: team.name });
      this.formSlug.setValue({ slug: team.slug });
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
  }

  ngOnDestroy() {
    this._subTeam.unsubscribe();
  }

  onSubmit(type: EModalType, model: FormContent) {
    switch (type) {
      case EModalType.ChangeName:
        if (!this.formName.valid) {
          break;
        }
        if (isEqual(this.team.name, model.name)) {
          break;
        }
        this.updateTeamName(model.name);
        break;

      case EModalType.ChangeSlug:
        if (!this.formSlug.valid) {
          break;
        }
        if (isEqual(this.team.slug, model.slug)) {
          break;
        }
        this.updateTeamSlug(model.slug);
        break;
    }
    this.submitted = true;
  }

  openConfirmModal(type: EModalType) {
    const elements = new Map<EModalType, ConfirmElements>([
      [
        EModalType.DeleteTeam,
        {
          title: `Delete Team ${this.team.name}`,
          message: `<p>
            You are about to delete team <strong>${this.team.name}</strong>.
            This action permanently removes all data associated with this team.
            Are you sure you want to delete this team?</p>`,
          button: 'Delete',
          severity: AlertType.Danger,
          confirmText: `${this.team.slug}`,
          confirmAction: () => {
            const url = ['team', this.team.slug].join('/');
            return this.apiService.delete(url);
          },
          onActionSuccess: () => {
            localStorage.removeItem(ELocalStorageKey.LastVisitedTeam);
            this.router.navigate(['..'], { relativeTo: this.route });
          },
          onActionFailure: (err: HttpErrorResponse) => this.extractError(err)
        }
      ],
      [
        EModalType.LeaveTeam,
        {
          title: `Leave Team ${this.team.name}`,
          message: `<p>
            You are about to leave team <strong>${this.team.name}</strong>.
            Once you leave a team, you need a new invitation to join back
            in the future. Are you sure you want to leave this team?</p>`,
          button: 'Leave',
          severity: AlertType.Danger,
          confirmAction: () => {
            const url = ['team', this.team.slug, 'leave'].join('/');
            return this.apiService.post(url);
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
        'team already registered',
        'There is already a team with this slug.'
      ]
    ]);
  }

  private updateTeamName(name: string) {
    const url = ['team', this.team.slug].join('/');
    this.apiService.patch(url, { name }).subscribe({
      next: () => {
        this.alert.changeTeamName = {
          type: AlertType.Success,
          text: 'Team name was updated.'
        };
        timer(5000).subscribe(() => (this.alert.changeTeamName = undefined));
        this.teamPageService.updateTeamSlug(this.team.slug);
      },
      error: (err: HttpErrorResponse) => {
        this.alert.changeTeamName = {
          type: AlertType.Danger,
          text: this.extractError(err)
        };
      }
    });
  }

  private updateTeamSlug(slug: string) {
    const url = ['team', this.team.slug].join('/');
    this.apiService.patch(url, { slug }).subscribe({
      next: () => {
        this.alert.changeTeamSlug = {
          type: AlertType.Success,
          text: 'Team slug was updated.'
        };
        timer(5000).subscribe(() => (this.alert.changeTeamSlug = undefined));
        this.teamPageService.updateTeamSlug(slug);
        this.router.navigate(['~', slug]);
      },
      error: (err: HttpErrorResponse) => {
        this.alert.changeTeamSlug = {
          type: AlertType.Danger,
          text: this.extractError(err)
        };
      }
    });
  }
}
