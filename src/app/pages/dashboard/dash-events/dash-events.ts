import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule }   from 'ng-zorro-antd/icon';
import { NzTagModule }    from 'ng-zorro-antd/tag';
import { NzSpinModule }   from 'ng-zorro-antd/spin';
import { NzEmptyModule }  from 'ng-zorro-antd/empty';

import { ApiService } from '../../../core/services/api.service';
import { EventType, SmeEvent } from '../../../core/models';

@Component({
  selector: 'app-dash-events',
  imports: [
    RouterLink, DatePipe,
    NzButtonModule, NzIconModule, NzTagModule, NzSpinModule, NzEmptyModule,
  ],
  templateUrl: './dash-events.html',
  styleUrl:    './dash-events.less',
})
export class DashEvents implements OnInit {
  private api        = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  events  = signal<SmeEvent[]>([]);

  ngOnInit() {
    this.api.getDashboardEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: evts => { this.events.set(evts); this.loading.set(false); },
        error: ()  => { this.loading.set(false); },
      });
  }

  typeColor(type: EventType): string {
    const map: Record<EventType, string> = {
      'trade-fair': 'orange', 'workshop': 'blue', 'exhibition': 'purple',
      'webinar': 'cyan', 'networking': 'green',
    };
    return map[type] ?? 'default';
  }
}
