/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ApiService } from 'src/app/core/services';
import { errorLogger } from 'src/app/shared/utils/errorLogger';

interface IFormContent {
  body: string;
  name: string;
  page: string;
}

enum Alerts {
  Success = 'alert-success',
  Danger = 'alert-danger'
}

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
        Validators.maxLength(1024)
      ],
      updateOn: 'blur'
    }),
    name: new FormControl('', {
      validators: [
        Validators.minLength(1),
        Validators.maxLength(64)
      ],
      updateOn: 'blur'
    })
  });
  alert?: [Alerts, string];
  submitted: boolean;
  prev: IFormContent;

  /**
   *
   */
  constructor(private apiService: ApiService) { }

  /**
   *
   */
  shouldHideAriaDescription(field: string): boolean {
    return (!this.submitted && this.feedbackForm.controls[field].pristine) ||
        this.feedbackForm.controls[field].valid;
  }

  /**
   *
   */
  onSubmit(model: IFormContent) {
    if (!this.feedbackForm.valid) {
      this.alert = [Alerts.Danger, 'Your message is invalid.'];
      return;
    }
    if (this.prev === model) {
      return;
    }
    this.submitted = true;
    if (model.name === '') {
      model.name = 'Anonymous';
    }
    model.page = 'dummy';
    this.apiService.post('/feedback', model).subscribe(
      () => {
        this.alert = [Alerts.Success, 'Your message was delivered.'];
        this.feedbackForm.reset();
        this.submitted = false;
        this.prev = null;
      },
      err => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ]
        ]);
        this.alert = [Alerts.Danger, msg];
        errorLogger.notify(err);
        this.prev = model;
      }
    );
  }

}
