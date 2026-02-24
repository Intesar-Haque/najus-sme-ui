import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

import { DataService } from '../../core/services/data.service';
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

@Component({
  selector: 'app-events',
  imports: [
    RouterLink, FormsModule, DatePipe, NgTemplateOutlet,
    NzButtonModule, NzIconModule, NzInputModule, NzSelectModule,
    NzTagModule, NzSwitchModule, NzDrawerModule, NzEmptyModule,
    NzBreadCrumbModule, NzBadgeModule, NzDividerModule,
  ],
  templateUrl: './events.html',
  styleUrl:    './events.less',
})
export class Events implements OnInit {
  private data = inject(DataService);

  readonly allEvents = this.data.events;

  readonly typeOptions: EventTypeOption[] = [
    { value: 'trade-fair',  label: 'Trade Fair',  icon: 'shop'      },
    { value: 'workshop',    label: 'Workshop',    icon: 'tool'      },
    { value: 'exhibition',  label: 'Exhibition',  icon: 'picture'   },
    { value: 'webinar',     label: 'Webinar',     icon: 'video-camera' },
    { value: 'networking',  label: 'Networking',  icon: 'team'      },
  ];

  readonly sortOptions = [
    { value: 'date-asc',  label: 'Earliest First'  },
    { value: 'date-desc', label: 'Latest First'    },
    { value: 'featured',  label: 'Featured First'  },
  ];

  // ── Filter state ──────────────────────────────────────────────────────
  searchQuery       = signal('');
  selectedTypes     = signal<EventType[]>([]);
  freeOnly          = signal(false);
  openOnly          = signal(false);
  sortBy            = signal<EventSort>('date-asc');
  filterDrawerOpen  = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────
  filteredEvents = computed(() => {
    let list = [...this.allEvents];

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q)
      );
    }

    const types = this.selectedTypes();
    if (types.length) list = list.filter(e => types.includes(e.type));

    if (this.freeOnly()) list = list.filter(e => e.isFree);
    if (this.openOnly()) list = list.filter(e => e.registrationOpen);

    switch (this.sortBy()) {
      case 'date-asc':  list.sort((a, b) => a.date.localeCompare(b.date));        break;
      case 'date-desc': list.sort((a, b) => b.date.localeCompare(a.date));        break;
      case 'featured':  list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
    }
    return list;
  });

  totalCount = computed(() => this.filteredEvents().length);

  freeCount     = computed(() => this.allEvents.filter(e => e.isFree).length);
  upcomingCount = computed(() => this.allEvents.filter(e => e.registrationOpen).length);

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

  ngOnInit() {}

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
    this.sortBy.set('date-asc');
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
