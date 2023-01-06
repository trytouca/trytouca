// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerEventJob } from '@touca/api-schema';
import { Subject } from 'rxjs';

import { getBackendUrl } from '@/core/models/environment';

@Injectable()
export class EventService implements OnDestroy {
  private source: EventSource;
  private subject = new Subject<ServerEventJob>();
  event$ = this.subject.asObservable();

  constructor(route: ActivatedRoute) {
    const team = route.snapshot.paramMap.get('team');
    const suite = route.snapshot.paramMap.get('suite');
    const batch = route.snapshot.paramMap.get('batch');
    const path = batch
      ? `/batch/${team}/${suite}/${batch}/events`
      : suite
      ? `/suite/${team}/${suite}/events`
      : team
      ? `/team/${team}/events`
      : '';
    if (path.length === 0) {
      return;
    }
    const url = getBackendUrl() + path;
    this.source = new EventSource(url, { withCredentials: true });
    this.source.addEventListener('error', console.error);
    this.source.addEventListener('message', (msg) => {
      const job: ServerEventJob = JSON.parse(msg.data as string);
      this.subject.next(job);
    });
  }

  ngOnDestroy(): void {
    this.source?.removeAllListeners();
    this.source?.close();
  }
}
