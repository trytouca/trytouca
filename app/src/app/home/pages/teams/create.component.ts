/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { ApiService } from '@weasel/core/services';
import { ModalComponent } from '@weasel/home/components';

interface IFormContent {
  name: string;
  slug: string;
}

enum Alerts {
  Success = 'alert-success',
  Danger = 'alert-danger'
}

enum Mode {
  Create = 'create',
  Join = 'join'
}

type Content = {
  mode: Mode,
  title: string,
  linkText: string,
  buttonText: string,
  slugDesc: string,
  onSubmit: (IFormContent) => void
};

@Component({
  selector: 'app-teams-create',
  templateUrl: './create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamsCreateTeamComponent extends ModalComponent {

  Mode = Mode;
  contents: Content[] = [
      {
        mode: Mode.Create,
        title: 'Create a New Team',
        linkText: 'Join an Existing Team',
        buttonText: 'Create',
        slugDesc: 'Unique url-friendly identifier e.g. "earth". Used in the links to your test suites and test results.',
        onSubmit: (model) => this.onCreate(model)
      },
      {
        mode: Mode.Join,
        title: 'Join an Existing Team',
        linkText: 'Create a New Team',
        buttonText: 'Join',
        slugDesc: 'URL-friendly identifier of the team you wish to join.',
        onSubmit: (model) => this.onJoin(model)
      }
  ];
  content: Content = this.contents.find(v => v.mode === Mode.Create);

  /**
   *
   */
  constructor(
    private apiService: ApiService,
    public dialogRef: DialogRef
  ) {
    super();
    super.form = new FormGroup({
      name: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(32)
        ],
        updateOn: 'blur'
      }),
      slug: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(16),
          Validators.pattern('[a-zA-Z][a-zA-Z0-9]+')
        ],
        updateOn: 'blur'
      })
    });
  }

  /**
   *
   */
  toggleMode() {
    const newMode = this.content.mode === Mode.Create ? Mode.Join : Mode.Create;
    const nameValidators = [ Validators.minLength(3), Validators.maxLength(32) ];
    if (newMode === Mode.Create) {
      nameValidators.push(Validators.required);
    }
    this.form.get('name').setValidators(nameValidators);
    this.form.get('name').updateValueAndValidity();
    this.content = this.contents.find(v => v.mode === newMode);
  }

  /**
   *
   */
  onCreate(model: IFormContent) {
    if (!this.form.valid) {
      return;
    }
    this.submitted = true;
    const body = { name: model.name, slug: model.slug.toLocaleLowerCase() };
    const url = 'team';
    this.apiService.post(url, body).subscribe(
      () => {
        this.form.reset();
        this.submitted = false;
        this.dialogRef.close(true);
      },
      (err: HttpErrorResponse) => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ],
          [ 409, 'team already registered', 'There is already a team with this slug.' ]
        ]);
        this.alert = [Alerts.Danger, msg];
      });
  }

  /**
   *
   */
  onJoin(model: IFormContent) {
    if (!this.form.valid) {
      return;
    }
    this.submitted = true;
    const url = ['team', model.slug.toLocaleLowerCase(), 'join'].join('/');
    this.apiService.post(url).subscribe(
      () => {
        this.form.reset();
        this.submitted = false;
        this.dialogRef.close(true);
      },
      (err: HttpErrorResponse) => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ],
          [ 404, 'team not found', 'There is no team matching the specified slug.' ],
          [ 409, 'user already a member', 'You are already a member of this team.' ],
          [ 409, 'user has pending join request', 'Your previous request to join this team is pending review by their administrators.']
        ]);
        this.alert = [Alerts.Danger, msg];
      });
  }

  /**
   *
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    super.keydownGuard(['j', 'k', 'Enter', 'Escape'], event);
  }

}
