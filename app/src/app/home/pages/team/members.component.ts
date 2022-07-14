// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { Subscription } from 'rxjs';

import {
  ETeamRole,
  TeamApplicant,
  TeamInvitee,
  TeamLookupResponse,
  TeamMember
} from '@touca/api-types';
import { ApiService, NotificationService, UserService } from '@/core/services';
import { ConfirmComponent } from '@/home/components/confirm.component';
import { PageListComponent } from '@/home/components/page-list.component';
import { FilterInput } from '@/home/models/filter.model';
import { AlertType } from '@/shared/components/alert.component';

import { TeamInviteComponent } from './invite.component';
import { TeamPageMember, TeamPageMemberType } from './team.model';
import { TeamPageService } from './team.service';

const filterInput: FilterInput<TeamPageMember> = {
  filters: [
    {
      key: 'none',
      name: 'None',
      func: (a) => true
    }
  ],
  sorters: [
    {
      key: 'name',
      name: 'Name',
      func: (a, b) => a.asMember().fullname.localeCompare(b.asMember().fullname)
    }
  ],
  searchBy: ['data.name'],
  defaults: {
    filter: 'none',
    search: '',
    sorter: 'name',
    order: 'dsc',
    pagen: 1,
    pagel: 100
  },
  queryKeys: {
    filter: 'mf',
    search: 'mq',
    sorter: 'ms',
    order: 'mo',
    pagen: 'mn',
    pagel: 'ml'
  },
  placeholder: 'Find a suite'
};

@Component({
  selector: 'app-team-tab-members',
  templateUrl: './members.component.html'
})
export class TeamTabMembersComponent
  extends PageListComponent<TeamPageMember>
  implements OnDestroy
{
  ItemType = TeamPageMemberType;
  isTeamAdmin = false;
  private _dialogRef: DialogRef;
  private _dialogSub: Subscription;
  private _team: TeamLookupResponse;
  private _subTeam: Subscription;

  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private teamPageService: TeamPageService,
    private userService: UserService,
    route: ActivatedRoute,
    router: Router
  ) {
    super(filterInput, Object.values(TeamPageMemberType), route, router);
    this._subTeam = teamPageService.data.team$.subscribe((v) => {
      this._team = v;
      this.isTeamAdmin = this.userService.isTeamAdmin(v.role);
    });
    this._subAllItems = teamPageService.data.members$.subscribe((v) => {
      this.initCollections(v);
    });
  }

  ngOnDestroy() {
    if (this._dialogSub) {
      this._dialogSub.unsubscribe();
    }
    this._subTeam.unsubscribe();
    super.ngOnDestroy();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing keys 'j' and 'k' should navigate through items on the list
    if (['j', 'k'].includes(event.key)) {
      super.keyboardNavigateList(event, '#wsl-team-tab-members');
      return;
    }
    const row = this.selectedRow;
    // pressing 'escape' when an item is selected should unselect it
    if ('Escape' === event.key && row !== -1) {
      this.selectedRow = -1;
    }
  }

  isSelf(member: TeamMember): boolean {
    const self = this.userService.currentUser;
    return !self || self.username === member.username;
  }

  invite() {
    this._dialogRef = this.dialogService.open(TeamInviteComponent, {
      closeButton: false,
      data: { teamSlug: this._team.slug },
      minHeight: '10vh'
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (state) {
          this.teamPageService.refreshMembers();
        }
      }
    );
  }

  confirmEdit(member: TeamMember): void {
    const newRoleName =
      member.role === ETeamRole.Member ? 'an Administrator' : 'a Member';
    this._dialogRef = this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: {
        title: `Make ${member.fullname} ${newRoleName}`,
        message: `<p>Are you sure you want to change <em>${member.fullname}</em>'s role to ${newRoleName}?</p>`,
        button: 'Change Role'
      },
      minHeight: '10vh'
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (!state) {
          return;
        }
        this.edit(member);
      }
    );
  }

  confirmRemove(member: TeamMember): void {
    this._dialogRef = this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: {
        title: 'Remove Member from Team',
        message: `<p>Are you sure you want to remove <em>${member.fullname}</em> from your team?</p>`,
        button: 'Remove'
      },
      minHeight: '10vh'
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (!state) {
          return;
        }
        this.remove(member);
      }
    );
  }

  confirmRescind(invitee: TeamInvitee): void {
    this._dialogRef = this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: {
        title: 'Rescind Invitation',
        message: `<p>Are you sure you want to rescind <em>${invitee.fullname}</em>'s invitation?</p>`,
        button: 'Rescind'
      },
      minHeight: '10vh'
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (!state) {
          return;
        }
        this.rescind(invitee);
      }
    );
  }

  confirmAccept(applicant: TeamApplicant): void {
    this._dialogRef = this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: {
        title: 'Accept Join Request',
        message: `<p>Are you sure you want to accept <em>${applicant.fullname}</em>'s request to join your team?</p>`,
        button: 'Accept'
      },
      minHeight: '10vh'
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (!state) {
          return;
        }
        this.accept(applicant);
      }
    );
  }

  confirmDecline(applicant: TeamApplicant): void {
    this._dialogRef = this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: {
        title: 'Decline Join Request',
        message: `<p>Are you sure you want to decline <em>${applicant.fullname}</em>'s request to join your team?</p>`,
        button: 'Decline'
      },
      minHeight: '10vh'
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (!state) {
          return;
        }
        this.decline(applicant);
      }
    );
  }

  private edit(member: TeamMember): void {
    const newRoleType =
      member.role === ETeamRole.Member ? ETeamRole.Admin : ETeamRole.Member;
    const url = ['team', this._team.slug, 'member', member.username].join('/');
    this.apiService.patch(url, { role: newRoleType }).subscribe({
      next: () => {
        this.teamPageService.refreshMembers();
        this.notificationService.notify(
          AlertType.Success,
          `Changed ${member.fullname}'s role.`
        );
      },
      error: () => {
        this.notificationService.notify(
          AlertType.Danger,
          `Something went wrong. We could not change ${member.fullname}'s role.`
        );
      }
    });
  }

  private remove(member: TeamMember): void {
    const url = ['team', this._team.slug, 'member', member.username].join('/');
    this.apiService.delete(url).subscribe({
      next: () => {
        this.teamPageService.removeMember(member);
        this.notificationService.notify(
          AlertType.Success,
          `Removed ${member.fullname} from this team.`
        );
      },
      error: () => {
        this.notificationService.notify(
          AlertType.Danger,
          `Something went wrong. We could not remove ${member.fullname}.`
        );
      }
    });
  }

  private rescind(invitee: TeamInvitee): void {
    const url = ['team', this._team.slug, 'invite', 'rescind'].join('/');
    this.apiService.post(url, { email: invitee.email }).subscribe({
      next: () => {
        this.teamPageService.removeInvitee(invitee);
        this.notificationService.notify(
          AlertType.Success,
          'Rescinded team invitation.'
        );
      },
      error: () => {
        this.notificationService.notify(
          AlertType.Danger,
          'Something went wrong. We could not rescind team invitation.'
        );
      }
    });
  }

  private accept(applicant: TeamApplicant): void {
    const url = ['team', this._team.slug, 'join', applicant.username].join('/');
    this.apiService.post(url).subscribe({
      next: () => {
        const msg = `${applicant.fullname} is now a member of your team.`;
        this.teamPageService.refreshMembers();
        this.notificationService.notify(AlertType.Success, msg);
      },
      error: () => {
        this.notificationService.notify(
          AlertType.Danger,
          'Something went wrong. We could not accept this request.'
        );
      }
    });
  }

  private decline(applicant: TeamApplicant): void {
    const url = ['team', this._team.slug, 'join', applicant.username].join('/');
    this.apiService.delete(url).subscribe({
      next: () => {
        const msg = `You declined ${applicant.fullname}'s request to join your team.`;
        this.teamPageService.refreshMembers();
        this.notificationService.notify(AlertType.Success, msg);
      },
      error: () => {
        this.notificationService.notify(
          AlertType.Danger,
          'Something went wrong. We could not decline this request.'
        );
      }
    });
  }
}
