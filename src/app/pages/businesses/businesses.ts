import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap } from 'rxjs/operators';

import { NzInputModule }   from 'ng-zorro-antd/input';
import { NzButtonModule }  from 'ng-zorro-antd/button';
import { NzIconModule }    from 'ng-zorro-antd/icon';
import { NzSelectModule }  from 'ng-zorro-antd/select';
import { NzSwitchModule }  from 'ng-zorro-antd/switch';
import { NzTagModule }     from 'ng-zorro-antd/tag';
import { NzDrawerModule }  from 'ng-zorro-antd/drawer';
import { NzEmptyModule }   from 'ng-zorro-antd/empty';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzBadgeModule }   from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpinModule }    from 'ng-zorro-antd/spin';

import { ApiService, VendorsResponse } from '../../core/services/api.service';
import { VendorCard }  from '../../shared/components/vendor-card/vendor-card';

export type BizSort = 'default' | 'rating' | 'products' | 'newest' | 'name';

interface FilterChip {
  label: string;
  type: 'search' | 'category' | 'district' | 'verified';
  value?: string;
}

const EMPTY_RESULT: VendorsResponse = {
  data: [],
  meta: { total: 0, current_page: 1, last_page: 1, per_page: 20, all_categories: [], all_districts: [] },
};

@Component({
  selector: 'app-businesses',
  imports: [
    RouterLink, FormsModule, NgTemplateOutlet,
    NzInputModule, NzButtonModule, NzIconModule, NzSelectModule,
    NzSwitchModule, NzTagModule, NzDrawerModule, NzEmptyModule,
    NzBreadCrumbModule, NzBadgeModule, NzDividerModule, NzSpinModule,
    VendorCard,
  ],
  templateUrl: './businesses.html',
  styleUrl:    './businesses.less',
})
export class Businesses implements OnInit {
  private api   = inject(ApiService);
  private route = inject(ActivatedRoute);

  readonly sortOptions = [
    { value: 'default',  label: 'Featured First'   },
    { value: 'rating',   label: 'Highest Rated'    },
    { value: 'products', label: 'Most Products'    },
    { value: 'newest',   label: 'Newest Members'   },
    { value: 'name',     label: 'Name (A → Z)'     },
  ];

  // ── Filter state ─────────────────────────────────────────────────────
  searchQuery        = signal('');
  selectedCategories = signal<string[]>([]);
  selectedDistricts  = signal<string[]>([]);
  verifiedOnly       = signal(false);
  sortBy             = signal<BizSort>('default');
  filterDrawerOpen   = signal(false);

  // ── Combined filter params ────────────────────────────────────────────
  private filterParams = computed(() => ({
    q:          this.searchQuery() || undefined,
    categories: this.selectedCategories().length ? this.selectedCategories() : undefined,
    districts:  this.selectedDistricts().length  ? this.selectedDistricts()  : undefined,
    verified:   this.verifiedOnly() || undefined,
    sort:       this.sortBy() !== 'default' ? this.sortBy() : undefined,
    per_page:   50,
  }));

  // ── Reactive API result ───────────────────────────────────────────────
  private result$ = toObservable(this.filterParams).pipe(
    debounceTime(300),
    switchMap(p => this.api.getVendors(p)),
  );

  private result = toSignal(this.result$, { initialValue: EMPTY_RESULT });

  // ── Derived ───────────────────────────────────────────────────────────
  readonly vendors       = computed(() => this.result().data);
  readonly totalCount    = computed(() => this.result().meta.total);
  readonly allCategories = computed(() => this.result().meta.all_categories);
  readonly allDistricts  = computed(() => this.result().meta.all_districts);

  // ── Active filter chips ───────────────────────────────────────────────
  activeFilterCount = computed(() =>
    (this.searchQuery() ? 1 : 0) +
    this.selectedCategories().length +
    this.selectedDistricts().length +
    (this.verifiedOnly() ? 1 : 0)
  );

  activeChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.searchQuery()) chips.push({ label: `"${this.searchQuery()}"`, type: 'search' });
    this.selectedCategories().forEach(c => chips.push({ label: c, type: 'category', value: c }));
    this.selectedDistricts().forEach(d => chips.push({ label: d, type: 'district', value: d }));
    if (this.verifiedOnly()) chips.push({ label: 'Verified Only', type: 'verified' });
    return chips;
  });

  // ── Lifecycle ────────────────────────────────────────────────────────
  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const cat = params.get('category');
    if (cat) this.selectedCategories.set([cat]);
  }

  // ── Handlers ─────────────────────────────────────────────────────────
  toggleCategory(cat: string) {
    this.selectedCategories.update(cats =>
      cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]
    );
  }

  toggleDistrict(d: string) {
    this.selectedDistricts.update(ds =>
      ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]
    );
  }

  removeChip(chip: FilterChip) {
    switch (chip.type) {
      case 'search':   this.searchQuery.set(''); break;
      case 'category': this.selectedCategories.update(c => c.filter(v => v !== chip.value)); break;
      case 'district': this.selectedDistricts.update(d => d.filter(v => v !== chip.value)); break;
      case 'verified': this.verifiedOnly.set(false); break;
    }
  }

  clearAll() {
    this.searchQuery.set('');
    this.selectedCategories.set([]);
    this.selectedDistricts.set([]);
    this.verifiedOnly.set(false);
    this.sortBy.set('default');
  }
}
