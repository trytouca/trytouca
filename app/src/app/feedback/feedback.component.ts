// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ApiService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';
import { errorLogger } from '@/shared/utils/errorLogger';

type IFormContent = {
  body: string;
  name: string;
  page: string;
};

@Component({
  selector: 'app-page-feedback',
  templateUrl: './feedback.component.html'
})
export class FeedbackComponent {
  /**
   *
   */
  feedbackForm = new FormGroup({
    body: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(1000)
      ],
      updateOn: 'blur'
    }),
    name: new FormControl('', {
      validators: [Validators.minLength(1), Validators.maxLength(100)],
      updateOn: 'blur'
    })
  });
  alert: Alert;
  submitted: boolean;
  prev: IFormContent;

  /**
   *
   */
  constructor(private apiService: ApiService) {}

  /**
   *
   */
  shouldHideAriaDescription(field: string): boolean {
    return (
      (!this.submitted && this.feedbackForm.controls[field].pristine) ||
      this.feedbackForm.controls[field].valid
    );
  }

  /**
   *
   */
  onSubmit(model: IFormContent) {
    if (!this.feedbackForm.valid) {
      this.alert = { type: AlertType.Danger, text: 'Your message is invalid.' };
      return;
    }
    if (this.prev === model) {
      return;
    }
    this.submitted = true;
    if (model.name === '') {
      model.name = 'Anonymous';
    }
    model.page = 'feedback-form';
    this.apiService.post('/feedback', model).subscribe({
      next: () => {
        this.alert = {
          type: AlertType.Success,
          text: 'Your message was delivered.'
        };
        this.feedbackForm.reset();
        this.submitted = false;
        this.prev = null;
      },
      error: (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
        errorLogger.notify(err);
        this.prev = model;
      }
    });
  }
}
