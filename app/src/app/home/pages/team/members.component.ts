/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService, DialogRef } from '@ngneat/dialog';
import { Subscription } from 'rxjs';
import { ConfirmComponent, ConfirmElements } from '@weasel/home/components/confirm.component';
import { ETeamRole, EPlatformRole, TeamInvitee, TeamMember, TeamLookupResponse, TeamApplicant } from '@weasel/core/models/commontypes';
import { ApiService, NotificationService, NotificationType, UserService } from '@weasel/core/services';
import { PageListComponent } from '@weasel/home/components/page-list.component';
import { FilterInput } from '@weasel/home/models/filter.model';
import { TeamPageMemberType, TeamPageMember } from './team.model';
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
  templateUrl: './members.component.html',
  styleUrls: ['../../styles/list.component.scss']
})
export class TeamTabMembersComponent extends PageListComponent<TeamPageMember> implements OnDestroy {

  ItemType = TeamPageMemberType;

  private _dialogRef: DialogRef;
  private _dialogSub: Subscription;
  private _team: TeamLookupResponse;
  private _subTeam: Subscription;

  /**
   *
   */
  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private teamPageService: TeamPageService,
    private userService: UserService,
    route: ActivatedRoute,
    router: Router,
  ) {
    super(filterInput, Object.values(TeamPageMemberType), route, router);
    this._subTeam = this.teamPageService.team$.subscribe(v => {
      this._team = v;
    });
    this._subAllItems = this.teamPageService.members$.subscribe(allItems => {
      this.initCollections(allItems);
    });
  }

  /**
   *
   */
  ngOnDestroy() {
    if (this._dialogSub) {
      this._dialogSub.unsubscribe();
    }
    this._subTeam.unsubscribe();
    super.ngOnDestroy();
  }

  /**
   *
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing keys 'j' and 'k' should navigate through items on the list
    if (['j', 'k'].includes(event.key)) {
      super.keyboardNavigateList(event, '#wsl-team-members');
      return;
    }
    const row = this.selectedRow;
    // pressing 'escape' when an item is selected should unselect it
    if ('Escape' === event.key && row !== -1) {
      this.selectedRow = -1;
    }
  }

  /**
   *
   */
  isTeamAdmin() {
    if (this.userService.currentUser) {
      const role = this.userService.currentUser.platformRole;
      if ([ EPlatformRole.Owner, EPlatformRole.Admin ].includes(role)) {
        return true;
      }
    }
    if (this._team) {
      const role = this._team.role;
      if ([ ETeamRole.Owner, ETeamRole.Admin ].includes(role)) {
        return true;
      }
    }
    return false;
  }

  /**
   *
   */
  isSelf(member: TeamMember): boolean {
    const self = this.userService.currentUser;
    return !self || self.username === member.username;
  }

  /**
   *
   */
  confirmEdit(member: TeamMember): void {
    const newRoleName = member.role === ETeamRole.Member ? 'an Administrator' : 'a Member';
    this._dialogRef = this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: {
        title: `Make ${member.fullname} ${newRoleName}`,
        message: `<p>Are you sure you want to change <em>${member.fullname}</em>'s role to ${newRoleName}?</p>`,
        button: 'Change Role'
      },
      minHeight: '10vh'
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe((state: boolean) => {
      if (!state) {
        return;
      }
      this.edit(member);
    });
  }

  /**
   *
   */
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
    this._dialogSub = this._dialogRef.afterClosed$.subscribe((state: boolean) => {
      if (!state) {
        return;
      }
      this.remove(member);
    });
  }

  /**
   *
   */
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
    this._dialogSub = this._dialogRef.afterClosed$.subscribe((state: boolean) => {
      if (!state) {
        return;
      }
      this.rescind(invitee);
    });
  }

  /**
   *
   */
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
    this._dialogSub = this._dialogRef.afterClosed$.subscribe((state: boolean) => {
      if (!state) {
        return;
      }
      this.accept(applicant);
    });
  }

  /**
   *
   */
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
    this._dialogSub = this._dialogRef.afterClosed$.subscribe((state: boolean) => {
      if (!state) {
        return;
      }
      this.decline(applicant);
    });
  }

  /**
   *
   */
  private edit(member: TeamMember): void {
    const newRoleType = member.role === ETeamRole.Member ? ETeamRole.Admin : ETeamRole.Member;
    const url = [ 'team', this._team.slug, 'member', member.username ].join('/');
    this.apiService.patch(url, { role: newRoleType }).subscribe(
      () => {
        this.teamPageService.refreshMembers();
        this.notificationService.notify(NotificationType.Success, `Changed ${member.fullname}'s role.`);
      },
      err => {
        this.notificationService.notify(NotificationType.Error,
          `Something went wrong. We could not change ${member.fullname}'s role.`);
      });
  }

  /**
   *
   */
  private remove(member: TeamMember): void {
    const url = [ 'team', this._team.slug, 'member', member.username ].join('/');
    this.apiService.delete(url).subscribe(
      () => {
        this.teamPageService.removeMember(member);
        this.notificationService.notify(NotificationType.Success, `Removed ${member.fullname} from this team.`);
      },
      err => {
        this.notificationService.notify(NotificationType.Error,
          `Something went wrong. We could not remove ${member.fullname}.`);
      });
  }

  /**
   *
   */
  private rescind(invitee: TeamInvitee): void {
    const url = [ 'team', this._team.slug, 'invite', 'rescind' ].join('/');
    this.apiService.post(url, { email: invitee.email }).subscribe(
      () => {
        this.teamPageService.removeInvitee(invitee);
        this.notificationService.notify(NotificationType.Success, 'Rescinded team invitation.');
      },
      err => {
        this.notificationService.notify(NotificationType.Error,
          'Something went wrong. We could not rescind team invitation.');
      });
  }

  /**
   *
   */
  private accept(applicant: TeamApplicant): void {
    const url = [ 'team', this._team.slug, 'join', applicant.username ].join('/');
    this.apiService.post(url).subscribe(
      () => {
        const msg = `${applicant.fullname} is now a member of your team.`;
        this.teamPageService.refreshMembers();
        this.notificationService.notify(NotificationType.Success, msg);
      },
      err => {
        this.notificationService.notify(NotificationType.Error,
          'Something went wrong. We could not accept this request.');
      });
  }

  /**
   *
   */
  private decline(applicant: TeamApplicant): void {
    const url = [ 'team', this._team.slug, 'join', applicant.username ].join('/');
    this.apiService.delete(url).subscribe(
      () => {
        const msg = `You declined ${applicant.fullname}'s request to join your team.`;
        this.teamPageService.refreshMembers();
        this.notificationService.notify(NotificationType.Success, msg);
      },
      err => {
        this.notificationService.notify(NotificationType.Error,
          'Something went wrong. We could not decline this request.');
      });
  }

}
