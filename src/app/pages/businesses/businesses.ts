import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

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
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule }     from '@angular/forms';

import { DataService } from '../../core/services/data.service';
import { VendorCard }  from '../../shared/components/vendor-card/vendor-card';

export type BizSort = 'default' | 'rating' | 'products' | 'newest' | 'name';

interface FilterChip {
  label: string;
  type: 'search' | 'category' | 'district' | 'verified';
  value?: string;
}

@Component({
  selector: 'app-businesses',
  imports: [
    RouterLink, FormsModule, NgTemplateOutlet,
    NzInputModule, NzButtonModule, NzIconModule, NzSelectModule,
    NzSwitchModule, NzTagModule, NzDrawerModule, NzEmptyModule,
    NzBreadCrumbModule, NzBadgeModule, NzDividerModule,
    VendorCard,
  ],
  templateUrl: './businesses.html',
  styleUrl:    './businesses.less',
})
export class Businesses implements OnInit {
  private data  = inject(DataService);
  private route = inject(ActivatedRoute);

  // ── Static data ──────────────────────────────────────────────────────
  readonly allVendors    = this.data.vendors;
  readonly allCategories = this.data.allVendorCategories;
  readonly allDistricts  = this.data.allDistricts;

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

  // ── Computed ─────────────────────────────────────────────────────────
  filteredVendors = computed(() => {
    let list = [...this.allVendors];

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.categories.some(c => c.toLowerCase().includes(q))
      );
    }

    const cats = this.selectedCategories();
    if (cats.length) list = list.filter(v => cats.some(c => v.categories.includes(c)));

    const districts = this.selectedDistricts();
    if (districts.length) list = list.filter(v => districts.includes(v.district));

    if (this.verifiedOnly()) list = list.filter(v => v.verified);

    switch (this.sortBy()) {
      case 'rating':   list.sort((a, b) => b.rating - a.rating);             break;
      case 'products': list.sort((a, b) => b.productCount - a.productCount); break;
      case 'newest':   list.sort((a, b) => +b.memberSince - +a.memberSince); break;
      case 'name':     list.sort((a, b) => a.name.localeCompare(b.name));    break;
      default:         list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return list;
  });

  totalCount = computed(() => this.filteredVendors().length);

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
