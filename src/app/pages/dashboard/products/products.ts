import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NzButtonModule }  from 'ng-zorro-antd/button';
import { NzIconModule }    from 'ng-zorro-antd/icon';
import { NzTagModule }     from 'ng-zorro-antd/tag';
import { NzSpinModule }    from 'ng-zorro-antd/spin';
import { NzEmptyModule }   from 'ng-zorro-antd/empty';
import { NzInputModule }   from 'ng-zorro-antd/input';
import { NzSelectModule }  from 'ng-zorro-antd/select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { NzMessageService }  from 'ng-zorro-antd/message';
import { NzModalService }    from 'ng-zorro-antd/modal';

import { ApiService }        from '../../../core/services/api.service';
import { Category, Product } from '../../../core/models';

type StatusKey = 'all' | 'live' | 'draft' | 'under_qa' | 'out_of_stock' | 'deleted';
type SortKey   = 'newest' | 'name-asc' | 'price-asc' | 'price-desc';

@Component({
  selector: 'app-dash-products',
  imports: [
    RouterLink, DecimalPipe, FormsModule,
    NzButtonModule, NzIconModule, NzTagModule, NzSpinModule, NzEmptyModule,
    NzInputModule, NzSelectModule, NzToolTipModule,
  ],
  providers: [NzModalService],
  templateUrl: './products.html',
  styleUrl:    './products.less',
})
export class DashProducts implements OnInit {
  private api        = inject(ApiService);
  private message    = inject(NzMessageService);
  private modal      = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  loading      = signal(true);
  products     = signal<Product[]>([]);
  // Fix for QA bugs #71/#72 ("Deleted tab shows nothing" / "no restore
  // feature") — see SQA-FIX.md Fix #6. The default /dashboard/products
  // fetch excludes soft-deleted rows entirely (Eloquent's normal
  // behaviour), so the Deleted tab needs its own fetch — it was never
  // going to appear by filtering the main list, no matter how that filter
  // was written.
  deletedProducts = signal<Product[]>([]);
  restoringId     = signal<string | null>(null);
  categories   = signal<Category[]>([]);
  activeStatus = signal<StatusKey>('all');
  searchQuery  = signal('');
  sortBy       = signal<SortKey>('newest');

  // Category drill-down selection (3 levels)
  selectedL1 = signal<Category | null>(null);
  selectedL2 = signal<Category | null>(null);
  selectedL3 = signal<Category | null>(null);

  readonly sortOptions: { label: string; value: SortKey }[] = [
    { label: 'Newest',   value: 'newest'     },
    { label: 'Name A–Z', value: 'name-asc'   },
    { label: 'Price ↑',  value: 'price-asc'  },
    { label: 'Price ↓',  value: 'price-desc' },
  ];

  // Derived category levels
  l2Categories = computed(() => this.selectedL1()?.children ?? []);
  l3Categories = computed(() => this.selectedL2()?.children ?? []);

  // The active leaf category (deepest selected)
  private activeCategory = computed(() =>
    this.selectedL3() ?? this.selectedL2() ?? this.selectedL1() ?? null
  );

  // IDs of the active category + all its descendants
  private activeFilterIds = computed((): Set<string> | null => {
    const cat = this.activeCategory();
    if (!cat) return null;
    const ids = new Set<string>();
    const collect = (c: Category) => {
      ids.add(c.id);
      c.children?.forEach(child => collect(child));
    };
    collect(cat);
    return ids;
  });

  // Status summary counts
  counts = computed(() => {
    const all = this.products();
    return {
      all:          all.length,
      live:         all.filter(p => p.status === 'live').length,
      draft:        all.filter(p => p.status === 'draft').length,
      under_qa:     all.filter(p => p.status === 'under_qa').length,
      out_of_stock: all.filter(p => !p.inStock).length,
      // Fix #71/#72 (SQA-FIX.md Fix #6) — deleted products were never in
      // `products()` to begin with (see the fetch in ngOnInit), so this is
      // its own signal rather than a filter over the same list.
      deleted:      this.deletedProducts().length,
    };
  });

  statusCards = computed(() => {
    const c = this.counts();
    return [
      { key: 'all'          as StatusKey, label: 'All Products',  icon: 'appstore',     count: c.all,          color: '#1890ff', bg: '#e6f4ff' },
      { key: 'live'         as StatusKey, label: 'Live',          icon: 'check-circle', count: c.live,         color: '#28a745', bg: '#f0fff4' },
      { key: 'draft'        as StatusKey, label: 'Draft',         icon: 'file-text',    count: c.draft,        color: '#fa8c16', bg: '#fff7e6' },
      { key: 'under_qa'     as StatusKey, label: 'Under Review',  icon: 'safety',       count: c.under_qa,     color: '#722ed1', bg: '#f9f0ff' },
      { key: 'out_of_stock' as StatusKey, label: 'Out of Stock',  icon: 'stop',         count: c.out_of_stock, color: '#ff4d4f', bg: '#fff1f0' },
      { key: 'deleted'      as StatusKey, label: 'Deleted',       icon: 'delete',       count: c.deleted,      color: '#8c8c8c', bg: '#f5f5f5' },
    ];
  });

  // Products after status filter only
  statusFilteredProducts = computed(() => {
    // Fix #71 (SQA-FIX.md Fix #6) — deleted products live in their own
    // signal, fetched separately; see counts() above for why.
    if (this.activeStatus() === 'deleted') return this.deletedProducts();

    const all = this.products();
    switch (this.activeStatus()) {
      case 'live':         return all.filter(p => p.status === 'live');
      case 'draft':        return all.filter(p => p.status === 'draft');
      case 'under_qa':     return all.filter(p => p.status === 'under_qa');
      case 'out_of_stock': return all.filter(p => !p.inStock);
      default:             return all;
    }
  });

  filteredProducts = computed(() => {
    let list = this.statusFilteredProducts();

    const filterIds = this.activeFilterIds();
    if (filterIds) list = list.filter(p => filterIds.has(p.categoryId));

    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q));

    const sorted = [...list];
    switch (this.sortBy()) {
      case 'name-asc':   sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'price-asc':  sorted.sort((a, b) => a.price - b.price);            break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price);            break;
    }
    return sorted;
  });

  // Count products (after status filter) in a category's subtree
  catCount(cat: Category): number {
    const ids = new Set<string>();
    const collect = (c: Category) => {
      ids.add(c.id);
      c.children?.forEach(child => collect(child));
    };
    collect(cat);
    return this.statusFilteredProducts().filter(p => ids.has(p.categoryId)).length;
  }

  selectL1(cat: Category) {
    this.selectedL1.set(cat);
    this.selectedL2.set(null);
    this.selectedL3.set(null);
  }

  selectL2(cat: Category) {
    this.selectedL2.set(cat);
    this.selectedL3.set(null);
  }

  clearCategoryFilter() {
    this.selectedL1.set(null);
    this.selectedL2.set(null);
    this.selectedL3.set(null);
  }

  setStatus(key: StatusKey) {
    this.activeStatus.set(key);
    this.clearCategoryFilter();
  }

  totalStock = (p: Product): number =>
    p.variants?.reduce((s, v) => s + v.stock, 0) ?? 0;

  statusDotColor(p: Product): string {
    // Fix #71 (SQA-FIX.md Fix #6) — soft-delete never changes `status`, so
    // a deleted product would otherwise still show its old "Live"/"Draft"
    // colour here. `deletedAt` is the real signal.
    if (p.deletedAt) return '#8c8c8c';
    if (!p.inStock) return '#ff4d4f';
    switch (p.status) {
      case 'live':     return '#28a745';
      case 'draft':    return '#fa8c16';
      case 'under_qa': return '#722ed1';
      default:         return '#8c8c8c';
    }
  }

  statusTagLabel(p: Product): string {
    if (p.deletedAt) return 'Deleted';
    if (!p.inStock) return 'Out of Stock';
    switch (p.status) {
      case 'live':     return 'Live';
      case 'draft':    return 'Draft';
      case 'under_qa': return 'Under Review';
      default:         return p.status ?? '';
    }
  }

  ngOnInit() {
    forkJoin({
      products:        this.api.getDashboardProducts(),
      deletedProducts: this.api.getDashboardProducts('deleted'),
      categories:      this.api.getCategories(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ products, deletedProducts, categories }) => {
        this.products.set(products);
        this.deletedProducts.set(deletedProducts);
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  // Fix for QA bug #72 ("no feature to view deleted items and restore").
  // See SQA-FIX.md Fix #6. The backend endpoint already existed
  // (POST /dashboard/products/{id}/restore) — nothing in the UI ever
  // called it.
  restore(product: Product) {
    this.modal.confirm({
      nzTitle:   `Restore "${product.name}"?`,
      nzContent: 'It will go back to your Drafts so you can review it before resubmitting.',
      nzOkText:  'Restore',
      nzOnOk:    () => this.doRestore(product),
    });
  }

  private doRestore(product: Product) {
    this.restoringId.set(product.id);
    this.api.restoreDashboardProduct(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.deletedProducts.update(list => list.filter(p => p.id !== product.id));
          this.products.update(list => [data, ...list]);
          this.restoringId.set(null);
          this.message.success(`"${product.name}" restored to Drafts.`);
        },
        error: () => {
          this.restoringId.set(null);
          this.message.error('Failed to restore product. Please try again.');
        },
      });
  }
}
