// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { Subscription } from 'rxjs';

import type { TeamItem } from '@/core/models/commontypes';
import { ELocalStorageKey } from '@/core/models/frontendtypes';
import { AlertKind, AlertService, ApiService } from '@/core/services';
import { ConfirmComponent, ConfirmElements, PageTab } from '@/home/components';
import { TeamCreateSuiteComponent } from './create-suite.component';
import { TeamInviteComponent } from './invite.component';
import {
  TeamPageService,
  TeamPageTabType,
  TeamBannerType,
  RefinedTeamList
} from './team.service';
import { TeamCreateTeamComponent } from './create-team.component';

type NotFound = Partial<{
  teamSlug: string;
}>;

@Component({
  selector: 'app-team-page',
  templateUrl: './page.component.html',
  styleUrls: ['../../styles/page.component.scss'],
  providers: [TeamPageService]
})
export class TeamPageComponent implements OnInit, OnDestroy {
  teams: RefinedTeamList;
  team: TeamItem;

  tabs: PageTab<TeamPageTabType>[];
  currentTab: TeamPageTabType;
  TabType = TeamPageTabType;

  banner: TeamBannerType;
  BannerType = TeamBannerType;

  private _dialogRef: DialogRef;
  private _notFound: Partial<NotFound> = {};
  private _sub: Record<
    'alert' | 'banner' | 'dialog' | 'tabs' | 'teams' | 'team',
    Subscription
  >;

  constructor(
    alertService: AlertService,
    private apiService: ApiService,
    private dialogService: DialogService,
    private router: Router,
    private teamPageService: TeamPageService,
    private route: ActivatedRoute
  ) {
    this._sub = {
      alert: alertService.alerts$.subscribe((v) => {
        if (v.some((k) => k.kind === AlertKind.TeamNotFound)) {
          this.banner = TeamBannerType.TeamNotFound;
          this._notFound.teamSlug = this.route.snapshot.paramMap.get('team');
        }
      }),
      banner: teamPageService.banner$.subscribe((v) => {
        this.banner = v;
        if (this.banner === this.BannerType.TeamNotFound) {
          this._notFound.teamSlug = route.snapshot.paramMap.get('team');
        }
      }),
      dialog: undefined,
      tabs: teamPageService.tabs$.subscribe((v) => {
        this.tabs = v;
        const queryMap = this.route.snapshot.queryParamMap;
        const getQuery = (key: string) =>
          queryMap.has(key) ? queryMap.get(key) : null;
        const tab = this.tabs.find((v) => v.link === getQuery('t')) || v[0];
        this.currentTab = tab.type;
      }),
      teams: teamPageService.teams$.subscribe((v) => {
        if (v.active.length && !this.route.snapshot.params.team) {
          const activeTeam =
            localStorage.getItem(ELocalStorageKey.LastVisitedTeam) ??
            v.active[0].slug;
          this.router.navigate(['~', activeTeam]);
        }
        this.teams = v;
      }),
      team: teamPageService.team$.subscribe((v) => {
        this.team = v;
      })
    };
  }

  ngOnInit() {
    this.teamPageService.init(this.route.snapshot.params as { team: string });
  }

  ngOnDestroy() {
    Object.values(this._sub)
      .filter(Boolean)
      .forEach((v) => v.unsubscribe());
  }

  fetchItems(): void {
    const teamSlug = this.route.snapshot.paramMap.get('team');
    this.teamPageService.fetchItems({ teamSlug });
  }

  public hasData() {
    return this.teamPageService.hasData();
  }

  public hasItems() {
    return this.teamPageService.countItems() !== 0;
  }

  public notFound(): Partial<NotFound> | null {
    if (Object.keys(this._notFound).length) {
      return this._notFound;
    }
  }

  public switchTab(type: TeamPageTabType) {
    this.currentTab = type;
  }

  public switchPage(teamSlug: string) {
    if (this.team.slug !== teamSlug) {
      this.router.navigate(['~', teamSlug]);
      this.teamPageService.updateTeamSlug(teamSlug);
    }
  }

  openCreateModal() {
    this._dialogRef = this.dialogService.open(TeamCreateSuiteComponent, {
      closeButton: false,
      data: { teamSlug: this.team.slug },
      minHeight: '10vh'
    });
    this._sub.dialog = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (state) {
          this.teamPageService.refreshSuites();
        }
      }
    );
  }

  openInviteModal() {
    this._dialogRef = this.dialogService.open(TeamInviteComponent, {
      closeButton: false,
      data: { teamSlug: this.team.slug },
      minHeight: '10vh'
    });
    this._sub.dialog = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (state) {
          this.teamPageService.refreshMembers();
        }
      }
    );
  }

  openCreateTeamModel() {
    this._dialogRef = this.dialogService.open(TeamCreateTeamComponent, {
      closeButton: false,
      minHeight: '10vh'
    });
    this._sub.dialog = this._dialogRef.afterClosed$.subscribe((state) => {
      if (state) {
        if (state.action === 'create') {
          this.router.navigate(['~', state.slug]);
          this.teamPageService.refreshTeams(state.slug);
        } else {
          this.teamPageService.refreshTeams();
        }
      }
    });
  }

  confirmDecline(item: TeamItem): void {
    const elements: ConfirmElements = {
      title: 'Decline Team Invitation',
      message: `<p>Can you confirm you want to decline team <em>${item.name}</em>'s invitation?</p>`,
      button: 'Decline Invitation'
    };
    this.showConfirmation(elements, () => this.decline(item));
  }

  confirmRescind(item: TeamItem): void {
    const elements: ConfirmElements = {
      title: 'Rescind Join Request',
      message: `<p>Can you confirm you want to cancel your request to join team <em>${item.name}</em>?</p>`,
      button: 'Rescind Request'
    };
    this.showConfirmation(elements, () => this.rescind(item));
  }

  private showConfirmation(elements: ConfirmElements, func: () => void) {
    this._dialogRef = this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: elements,
      minHeight: '10vh'
    });
    this._sub.dialog = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (!state) {
          return;
        }
        func();
      }
    );
  }

  accept(item: TeamItem) {
    const url = ['team', item.slug, 'invite', 'accept'].join('/');
    this.apiService.post(url).subscribe(() => {
      this.teamPageService.init(this.route.snapshot.params as { team: string });
    });
  }

  private decline(item: TeamItem) {
    const url = ['team', item.slug, 'invite', 'decline'].join('/');
    this.apiService.post(url).subscribe(() => {
      this.teamPageService.init(this.route.snapshot.params as { team: string });
    });
  }

  private rescind(item: TeamItem) {
    const url = ['team', item.slug, 'join'].join('/');
    this.apiService.delete(url).subscribe(() => {
      this.teamPageService.init(this.route.snapshot.params as { team: string });
    });
  }
}
