// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class EventSourceService {
  constructor(private api: ApiService) {}

  //   create only requires the path, not protocol or domain.
  create(path: string) {
    return new EventSource(this.api.makeUrl(path), { withCredentials: true });
  }
}
