// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';

import { formFields, FormHint, FormHints } from '@/core/models/form-hint';
import { ApiService } from '@/core/services';
import { ModalComponent } from '@/home/components';
import { AlertType } from '@/shared/components/alert.component';

interface IFormContent {
  name: string;
  slug: string;
}

enum Mode {
  Create = 'create',
  Join = 'join'
}

type Content = {
  mode: Mode;
  title: string;
  linkText: string;
  buttonText: string;
  slugDesc: string;
  onSubmit: (IFormContent) => void;
};

@Component({
  selector: 'app-team-create-team',
  templateUrl: './create-team.component.html'
})
export class TeamCreateTeamComponent
  extends ModalComponent
  implements OnDestroy
{
  Mode = Mode;
  contents: Content[] = [
    {
      mode: Mode.Create,
      title: 'Create a New Team',
      linkText: 'Join an Existing Team',
      buttonText: 'Create',
      slugDesc:
        'Unique url-friendly identifier. Used in the links to your test suites and test results.',
      onSubmit: (model: IFormContent) => this.onCreate(model)
    },
    {
      mode: Mode.Join,
      title: 'Join an Existing Team',
      linkText: 'Create a New Team',
      buttonText: 'Join',
      slugDesc: 'URL-friendly identifier of the team you wish to join.',
      onSubmit: (model: IFormContent) => this.onJoin(model)
    }
  ];
  content: Content = this.contents.find((v) => v.mode === Mode.Create);

  constructor(private apiService: ApiService, public dialogRef: DialogRef) {
    super();
    super.form = new FormGroup({
      name: new FormControl('', {
        validators: formFields.entityName.validators,
        updateOn: 'blur'
      }),
      slug: new FormControl('', {
        validators: formFields.entitySlug.validators,
        updateOn: 'blur'
      })
    });
    super.hints = new FormHints({
      name: new FormHint(
        'Short user-friendly name. Appears on the Platform and the documents it generates.',
        formFields.entityName.validationErrors
      ),
      slug: new FormHint(
        'Unique url-friendly identifier. Used in the links to your test suites and test results.',
        formFields.entitySlug.validationErrors
      )
    });
    super.subscribeHints(['name', 'slug']);
  }

  ngOnDestroy() {
    super.unsubscribeHints();
  }

  toggleMode() {
    const newMode = this.content.mode === Mode.Create ? Mode.Join : Mode.Create;
    const nameValidators = [Validators.minLength(3), Validators.maxLength(32)];
    if (newMode === Mode.Create) {
      nameValidators.push(Validators.required);
    }
    this.form.get('name').setValidators(nameValidators);
    this.form.get('name').updateValueAndValidity();
    this.content = this.contents.find((v) => v.mode === newMode);
  }

  onCreate(model: IFormContent) {
    if (!this.form.valid) {
      return;
    }
    this.submitted = true;
    const body = { name: model.name, slug: model.slug.toLocaleLowerCase() };
    const url = 'team';
    this.apiService.post(url, body).subscribe({
      next: () => {
        this.hints.reset();
        this.form.reset();
        this.submitted = false;
        this.dialogRef.close({
          action: 'create',
          slug: model.slug.toLocaleLowerCase()
        });
      },
      error: (err: HttpErrorResponse) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.'],
          [
            409,
            'team already registered',
            'There is already a team with this slug.'
          ]
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    });
  }

  onJoin(model: IFormContent) {
    if (!this.form.valid) {
      return;
    }
    this.submitted = true;
    const url = ['team', model.slug.toLocaleLowerCase(), 'join'].join('/');
    this.apiService.post(url).subscribe({
      next: () => {
        this.hints.reset();
        this.form.reset();
        this.submitted = false;
        this.dialogRef.close({
          action: 'join',
          slug: model.slug.toLocaleLowerCase()
        });
      },
      error: (err: HttpErrorResponse) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.'],
          [
            404,
            'team not found',
            'There is no team matching the specified slug.'
          ],
          [
            409,
            'user already a member',
            'You are already a member of this team.'
          ],
          [
            409,
            'user has pending join request',
            'Your previous request to join this team is pending review by their administrators.'
          ]
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    });
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    super.keydownGuard(['j', 'k', 'Enter', 'Escape'], event);
  }
}
