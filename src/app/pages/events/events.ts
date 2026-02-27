import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap } from 'rxjs/operators';

import { NzButtonModule }    from 'ng-zorro-antd/button';
import { NzIconModule }      from 'ng-zorro-antd/icon';
import { NzInputModule }     from 'ng-zorro-antd/input';
import { NzSelectModule }    from 'ng-zorro-antd/select';
import { NzTagModule }       from 'ng-zorro-antd/tag';
import { NzSwitchModule }    from 'ng-zorro-antd/switch';
import { NzDrawerModule }    from 'ng-zorro-antd/drawer';
import { NzEmptyModule }     from 'ng-zorro-antd/empty';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzBadgeModule }     from 'ng-zorro-antd/badge';
import { NzDividerModule }   from 'ng-zorro-antd/divider';
import { NzSpinModule }      from 'ng-zorro-antd/spin';

import { ApiService, EventsResponse } from '../../core/services/api.service';
import { EventType } from '../../core/models';

export type EventSort = 'date-asc' | 'date-desc' | 'featured';

interface FilterChip {
  label: string;
  type: 'search' | 'type' | 'free' | 'open';
  value?: string;
}

interface EventTypeOption {
  value: EventType;
  label: string;
  icon: string;
}

const EMPTY_RESULT: EventsResponse = {
  data: [],
  meta: { total: 0, current_page: 1, last_page: 1, per_page: 50, free_count: 0, open_count: 0 },
};

@Component({
  selector: 'app-events',
  imports: [
    RouterLink, FormsModule, DatePipe, NgTemplateOutlet,
    NzButtonModule, NzIconModule, NzInputModule, NzSelectModule,
    NzTagModule, NzSwitchModule, NzDrawerModule, NzEmptyModule,
    NzBreadCrumbModule, NzBadgeModule, NzDividerModule, NzSpinModule,
  ],
  templateUrl: './events.html',
  styleUrl:    './events.less',
})
export class Events implements OnInit {
  private api   = inject(ApiService);
  private route = inject(ActivatedRoute);

  readonly typeOptions: EventTypeOption[] = [
    { value: 'trade-fair',  label: 'Trade Fair',  icon: 'shop'         },
    { value: 'workshop',    label: 'Workshop',    icon: 'tool'         },
    { value: 'exhibition',  label: 'Exhibition',  icon: 'picture'      },
    { value: 'webinar',     label: 'Webinar',     icon: 'video-camera' },
    { value: 'networking',  label: 'Networking',  icon: 'team'         },
  ];

  readonly sortOptions = [
    { value: 'featured',  label: 'Featured First'  },
    { value: 'date-asc',  label: 'Earliest First'  },
    { value: 'date-desc', label: 'Latest First'    },
  ];

  // ── Filter state ──────────────────────────────────────────────────────
  searchQuery      = signal('');
  selectedTypes    = signal<EventType[]>([]);
  freeOnly         = signal(false);
  openOnly         = signal(false);
  sortBy           = signal<EventSort>('featured');
  filterDrawerOpen = signal(false);

  // ── Combined filter params ────────────────────────────────────────────
  private filterParams = computed(() => ({
    q:        this.searchQuery() || undefined,
    types:    this.selectedTypes().length ? this.selectedTypes() : undefined,
    free:     this.freeOnly() || undefined,
    open:     this.openOnly() || undefined,
    sort:     this.sortBy(),
    per_page: 50,
  }));

  // ── Reactive API result ───────────────────────────────────────────────
  private result$ = toObservable(this.filterParams).pipe(
    debounceTime(300),
    switchMap(p => this.api.getEvents(p)),
  );

  private result = toSignal(this.result$, { initialValue: EMPTY_RESULT });

  // ── Derived ───────────────────────────────────────────────────────────
  readonly events       = computed(() => this.result().data);
  readonly totalCount   = computed(() => this.result().meta.total);
  readonly freeCount    = computed(() => this.result().meta.free_count);
  readonly upcomingCount = computed(() => this.result().meta.open_count);

  // ── Active filter chips ───────────────────────────────────────────────
  activeFilterCount = computed(() =>
    (this.searchQuery() ? 1 : 0) +
    this.selectedTypes().length +
    (this.freeOnly() ? 1 : 0) +
    (this.openOnly() ? 1 : 0)
  );

  activeChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.searchQuery()) chips.push({ label: `"${this.searchQuery()}"`, type: 'search' });
    this.selectedTypes().forEach(t => {
      const opt = this.typeOptions.find(o => o.value === t);
      chips.push({ label: opt?.label ?? t, type: 'type', value: t });
    });
    if (this.freeOnly()) chips.push({ label: 'Free Events', type: 'free' });
    if (this.openOnly()) chips.push({ label: 'Registration Open', type: 'open' });
    return chips;
  });

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const type = params.get('type') as EventType | null;
    if (type) this.selectedTypes.set([type]);
  }

  // ── Handlers ──────────────────────────────────────────────────────────
  toggleType(type: EventType) {
    this.selectedTypes.update(types =>
      types.includes(type) ? types.filter(t => t !== type) : [...types, type]
    );
  }

  removeChip(chip: FilterChip) {
    switch (chip.type) {
      case 'search': this.searchQuery.set(''); break;
      case 'type':   this.selectedTypes.update(t => t.filter(v => v !== chip.value as EventType)); break;
      case 'free':   this.freeOnly.set(false); break;
      case 'open':   this.openOnly.set(false); break;
    }
  }

  clearAll() {
    this.searchQuery.set('');
    this.selectedTypes.set([]);
    this.freeOnly.set(false);
    this.openOnly.set(false);
    this.sortBy.set('featured');
  }

  typeLabel(type: EventType): string {
    return this.typeOptions.find(o => o.value === type)?.label ?? type;
  }

  typeIcon(type: EventType): string {
    return this.typeOptions.find(o => o.value === type)?.icon ?? 'calendar';
  }

  typeColor(type: EventType): string {
    const map: Record<EventType, string> = {
      'trade-fair':  'orange',
      'workshop':    'blue',
      'exhibition':  'purple',
      'webinar':     'cyan',
      'networking':  'green',
    };
    return map[type] ?? 'default';
  }
}
