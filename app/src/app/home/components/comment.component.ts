/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FrontendCommentAction, FrontendCommentActionType, FrontendCommentItem } from '@weasel/core/models/frontendtypes';

@Component({
  selector: 'app-home-comment',
  templateUrl: './comment.component.html',
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
