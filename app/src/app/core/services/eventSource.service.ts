// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class EventSourceService {
  constructor(private api: ApiService) {}

  create(url: string) {
    return new EventSource(this.api.makeUrl(url), { withCredentials: true });
  }
}
