import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export type RefreshTarget =
  | 'patients'
  | 'appointments'
  | 'encounters'
  | 'episodes'
  | 'billing'
  | 'dashboard';

@Injectable({ providedIn: 'root' })
export class DataRefreshService {
  private readonly refresh$ = new Subject<RefreshTarget>();

  triggerRefresh(target: RefreshTarget): void {
    this.refresh$.next(target);
  }

  onRefresh(...targets: RefreshTarget[]): Observable<RefreshTarget> {
    return this.refresh$.asObservable().pipe(
      filter(target => targets.includes(target))
    );
  }
}
