/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  FrontendCommentAction,
  FrontendCommentActionType,
  FrontendCommentItem
} from '@/core/models/frontendtypes';
import { DateAgoPipe } from '@/shared/pipes';

@Component({
  selector: 'app-home-comment',
  templateUrl: './comment.component.html',
  providers: [DateAgoPipe]
})
export class CommentComponent {
  ActionType = FrontendCommentActionType;
  @Input() meta: FrontendCommentItem;
  @Output() commentAction = new EventEmitter<FrontendCommentAction>();

  /**
   *
   */
  performAction(actionType: FrontendCommentActionType): void {
    this.commentAction.emit({ actionType, commentId: this.meta.commentId });
  }
}
