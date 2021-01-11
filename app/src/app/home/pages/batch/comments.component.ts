/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import type { BatchLookupResponse, CommentItem, TeamLookupResponse } from '@weasel/core/models/commontypes';
import { EPlatformRole, ETeamRole } from '@weasel/core/models/commontypes';
import { FrontendCommentAction, FrontendCommentActionType, FrontendCommentItem } from '@weasel/core/models/frontendtypes';
import { ApiService, NotificationService, NotificationType, UserService } from '@weasel/core/services';
import { BatchPageService } from './batch.service';

type PageViewFields = {
  buttonCancelShow: boolean;
  buttonPreviewShow: boolean;
  buttonPreviewText: string;
  buttonSubmitText: string;
  editorSubtitle: string;
  editorTitle: string;
  previewShow: boolean;
};

type IFormContent = {
  body: string;
};

enum Alerts {
  Success = 'alert-success',
  Danger = 'alert-danger'
}

@Component({
  selector: 'app-batch-tab-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss']
})
export class BatchCommentsComponent implements OnDestroy {

  alert?: [Alerts, string];
  comments: FrontendCommentItem[] = [];
  form: FormGroup;
  fields: PageViewFields = {
    editorSubtitle: 'Share results of your investigations with your colleagues.',
    editorTitle: 'Write a Comment',
    buttonCancelShow: false,
    buttonPreviewShow: true,
    buttonPreviewText: 'Preview',
    buttonSubmitText: 'Submit',
    previewShow: false
  };

  private _team: TeamLookupResponse;
  private _batch: BatchLookupResponse;
  private _subTeam: Subscription;
  private _subBatch: Subscription;
  private _subComments: Subscription;
  private _commentAction: FrontendCommentAction = {
    actionType: FrontendCommentActionType.Post
  };

  /**
   *
   */
  constructor(
    private apiService: ApiService,
    private batchPageService: BatchPageService,
    private notificationService: NotificationService,
    private userService: UserService
  ) {
    this._subTeam = this.batchPageService.team$.subscribe(v => {
      this._team = v;
    });
    this._subBatch = this.batchPageService.batch$.subscribe(v => {
      this._batch = v;
    });
    this._subComments = this.batchPageService.comments$.subscribe(v => {
      this.comments = this.processComments(v);
    });
    this.form = new FormGroup({
      body: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(1000)
        ],
        updateOn: 'blur'
      })
    });
  }

  /**
   *
   */
  ngOnDestroy(): void {
    this._subTeam.unsubscribe();
    this._subBatch.unsubscribe();
    this._subComments.unsubscribe();
  }

  /**
   *
   */
  private processComments(comments: CommentItem[]): FrontendCommentItem[] {
    const myRolePlatform = this.userService.currentUser.platformRole;
    const myRoleTeam = this._team.role;
    const myUsername = this.userService.currentUser.username;
    const isPlatformAdmin = [ EPlatformRole.Admin, EPlatformRole.Owner ].includes(myRolePlatform);
    const isTeamAdmin = [ ETeamRole.Admin, ETeamRole.Owner ].includes(myRoleTeam);
    const process = (v: CommentItem, isReply = false): FrontendCommentItem => ({
      commentAuthor: v.by.fullname,
      commentBody: v.text,
      commentId: v.id,
      commentTime: v.at,
      commentEditTime: v.editedAt ?? undefined,
      replies: v.replies ? v.replies.map(k => process(k, true)) : [],
      showButtonReply: isReply === false,
      showButtonUpdate: myUsername === v.by.username,
      showButtonRemove: (!v.replies || v.replies.length === 0)
        && (myUsername === v.by.username || isTeamAdmin || isPlatformAdmin),
    });
    return comments.map(v => process(v)).sort((a, b) => +new Date(b.commentTime) - +new Date(a.commentTime));
  }

  /**
   *
   */
  async onSubmit(model: IFormContent) {
    if (this._commentAction.actionType !== FrontendCommentActionType.Remove && !this.form.valid) {
      return;
    }
    switch (this._commentAction.actionType) {
      case FrontendCommentActionType.Post:
        this.commentPost(model);
        break;
      case FrontendCommentActionType.Remove:
        this.commentRemove(this._commentAction.commentId);
        break;
      case FrontendCommentActionType.Reply:
        this.commentReply(model, this._commentAction.commentId);
        break;
      case FrontendCommentActionType.Update:
        this.commentUpdate(model, this._commentAction.commentId);
        break;
    }
  }

  /**
   *
   */
  togglePreview() {
    this.fields.previewShow = !this.fields.previewShow;
    this.fields.buttonPreviewText = this.fields.previewShow ? 'Edit' : 'Preview';
  }

  /**
   *
   */
  cancelForm() {
    this._commentAction = {
      actionType: FrontendCommentActionType.Post
    };
    this.alert = undefined;
    this.fields.buttonCancelShow = false;
    this.fields.buttonPreviewShow = true;
    this.fields.buttonSubmitText = 'Submit';
    this.fields.editorSubtitle = 'Share results of your investigations with your colleagues.';
    this.fields.editorTitle = 'Write a New Comment';
    this.form.reset();
    this.form.get('body').reset();
    this.form.get('body').enable();
    this.form.get('body').setValue('');
  }

  /**
   *
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const keys = ['j', 'k', 'p', 'Enter', 'Escape', 'Backspace'];
    if (keys.includes(event.key)) {
      event.stopImmediatePropagation();
    }
  }

  /**
   *
   */
  public commentAction(event: FrontendCommentAction): void {
    let comment = this.comments.find(v => v.commentId === event.commentId);
    if (!comment) {
      const parent = this.comments.find(v => v.replies.some(e => e.commentId === event.commentId));
      comment = parent.replies.find(v => v.commentId === event.commentId);
    }
    this._commentAction = event;
    this.fields.buttonCancelShow = true;
    this.form.reset();
    switch (event.actionType) {
      case FrontendCommentActionType.Remove:
        Object.assign(this.fields, {
          buttonPreviewShow: false,
          buttonSubmitText: 'Delete',
          editorTitle: 'Delete This Comment?',
          editorSubtitle: 'Are you sure you want to delete this comment?'
        });
        this.form.get('body').setValue(comment.commentBody);
        this.form.get('body').disable();
        break;
      case FrontendCommentActionType.Reply:
        Object.assign(this.fields, {
          buttonPreviewShow: true,
          buttonSubmitText: 'Reply',
          editorTitle: 'Reply to a Comment',
          editorSubtitle: `You are replying to ${comment.commentAuthor}'s comment.`
        });
        this.form.get('body').reset();
        this.form.get('body').enable();
        break;
      case FrontendCommentActionType.Update:
        Object.assign(this.fields, {
          buttonPreviewShow: false,
          buttonSubmitText: 'Edit',
          editorTitle: 'Edit This Comment',
          editorSubtitle: 'You are editing a previously submitted comment.'
        });
        this.form.get('body').setValue(comment.commentBody);
        this.form.get('body').enable();
        break;
    }
  }

  /**
   *
   */
  private commentPost(model: IFormContent) {
    const url = [
      'comment', this._batch.teamSlug, this._batch.suiteSlug,
      this._batch.batchSlug, 'c'
    ].join('/');
    this.apiService.post(url, { body: model.body }).subscribe(
      () => {
        this.cancelForm();
        this.batchPageService.refetchComments();
        this.batchPageService.refetchBatch();
      },
      err => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ],
        ]);
        this.alert = [Alerts.Danger, msg];
      }
    );
  }

  /**
   *
   */
  private commentRemove(commentId: string) {
    const url = [
      'comment', this._batch.teamSlug, this._batch.suiteSlug,
      this._batch.batchSlug, 'c', commentId
    ].join('/');
    this.apiService.delete(url).subscribe(
      () => {
        this.cancelForm();
        this.batchPageService.refetchComments();
        this.batchPageService.refetchBatch();
      },
      err => {
        this.notificationService.notify(NotificationType.Error,
          'Something went wrong. Please try this operation again later.');
      });
  }

  /**
   *
   */
  private commentReply(model: IFormContent, commentId: string) {
    const url = [
      'comment', this._batch.teamSlug, this._batch.suiteSlug,
      this._batch.batchSlug, 'c', commentId, 'reply'
    ].join('/');
    this.apiService.post(url, { body: model.body }).subscribe(
      () => {
        this.cancelForm();
        this.batchPageService.refetchComments();
        this.batchPageService.refetchBatch();
      },
      err => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ],
          [ 400, 'replying to replies not allowed', 'We do not support nested replies. Please reply to the top-level comment instead.' ]
        ]);
        this.alert = [Alerts.Danger, msg];
      }
    );
  }

  /**
   *
   */
  private commentUpdate(model: IFormContent, commentId: string) {
    const url = [
      'comment', this._batch.teamSlug, this._batch.suiteSlug,
      this._batch.batchSlug, 'c', commentId
    ].join('/');
    this.apiService.patch(url, { body: model.body }).subscribe(
      () => {
        this.cancelForm();
        this.batchPageService.refetchComments();
        this.batchPageService.refetchBatch();
      },
      err => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ],
        ]);
        this.alert = [Alerts.Danger, msg];
      }
    );
  }

}
