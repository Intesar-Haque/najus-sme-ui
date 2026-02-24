import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';

import { NzButtonModule }     from 'ng-zorro-antd/button';
import { NzIconModule }       from 'ng-zorro-antd/icon';
import { NzInputModule }      from 'ng-zorro-antd/input';
import { NzSelectModule }     from 'ng-zorro-antd/select';
import { NzSliderModule }     from 'ng-zorro-antd/slider';
import { NzSwitchModule }     from 'ng-zorro-antd/switch';
import { NzTagModule }        from 'ng-zorro-antd/tag';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzDrawerModule }     from 'ng-zorro-antd/drawer';
import { NzEmptyModule }      from 'ng-zorro-antd/empty';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDividerModule }    from 'ng-zorro-antd/divider';
import { NzBadgeModule }      from 'ng-zorro-antd/badge';
import { NzToolTipModule }    from 'ng-zorro-antd/tooltip';
import { NzCheckboxModule }   from 'ng-zorro-antd/checkbox';

import { DataService }  from '../../core/services/data.service';
import { ProductCard }  from '../../shared/components/product-card/product-card';
import { Category, Product } from '../../core/models';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'popular' | 'newest';
export type ViewMode   = 'grid' | 'list';

interface FilterChip {
  label: string;
  type: 'search' | 'category' | 'price' | 'rating' | 'stock';
  value?: string;
}

@Component({
  selector: 'app-products',
  imports: [
    RouterLink, FormsModule, DecimalPipe,
    NzButtonModule, NzIconModule, NzInputModule, NzSelectModule,
    NzSliderModule, NzSwitchModule, NzTagModule, NzPaginationModule,
    NzDrawerModule, NzEmptyModule, NzBreadCrumbModule, NzDividerModule,
    NzBadgeModule, NzToolTipModule, NzCheckboxModule,
    ProductCard, NgTemplateOutlet,
  ],
  templateUrl: './products.html',
  styleUrl:    './products.less',
})
export class Products implements OnInit {
  private data  = inject(DataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ── Static data ───────────────────────────────────────────────────────
  readonly allProducts  = this.data.products;
  readonly categories   = this.data.categories;
  readonly maxPrice     = this.data.maxPrice;
  readonly PAGE_SIZE    = 12;

  readonly sortOptions = [
    { value: 'default',    label: 'Relevance'       },
    { value: 'newest',     label: 'Newest First'    },
    { value: 'price-asc',  label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
    { value: 'rating',     label: 'Highest Rated'   },
    { value: 'popular',    label: 'Most Reviewed'   },
  ];

  readonly ratingOptions = [
    { value: 0,   label: 'Any' },
    { value: 4.5, label: '4.5+' },
    { value: 4,   label: '4+' },
    { value: 3,   label: '3+' },
  ];

  // ── Filter state ──────────────────────────────────────────────────────
  searchQuery         = signal('');
  selectedCategories  = signal<string[]>([]);
  priceRange          = signal<[number, number]>([0, this.maxPrice]);
  minRating           = signal(0);
  inStockOnly         = signal(false);
  sortBy              = signal<SortOption>('default');
  viewMode            = signal<ViewMode>('grid');
  currentPage         = signal(1);
  filterDrawerOpen    = signal(false);

  // Slider needs a plain array for ngModel (not a signal tuple)
  priceSlider: [number, number] = [0, this.maxPrice];

  // ── Computed ──────────────────────────────────────────────────────────
  filteredProducts = computed(() => {
    let list = [...this.allProducts];

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.vendor.name.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    const cats = this.selectedCategories();
    if (cats.length) list = list.filter(p => cats.includes(p.categoryId));

    const [minP, maxP] = this.priceRange();
    list = list.filter(p => p.price >= minP && p.price <= maxP);

    const minR = this.minRating();
    if (minR > 0) list = list.filter(p => p.rating >= minR);

    if (this.inStockOnly()) list = list.filter(p => p.inStock);

    switch (this.sortBy()) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price);          break;
      case 'price-desc': list.sort((a, b) => b.price - a.price);          break;
      case 'rating':     list.sort((a, b) => b.rating - a.rating);        break;
      case 'popular':    list.sort((a, b) => b.reviewCount - a.reviewCount); break;
      case 'newest':     list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    }
    return list;
  });

  totalCount = computed(() => this.filteredProducts().length);

  paginatedProducts = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.PAGE_SIZE;
    return this.filteredProducts().slice(start, start + this.PAGE_SIZE);
  });

  activeFilterCount = computed(() =>
    (this.searchQuery() ? 1 : 0) +
    this.selectedCategories().length +
    (this.minRating() > 0 ? 1 : 0) +
    (this.inStockOnly() ? 1 : 0) +
    (this.priceRange()[0] > 0 || this.priceRange()[1] < this.maxPrice ? 1 : 0)
  );

  activeChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this.searchQuery()) chips.push({ label: `"${this.searchQuery()}"`, type: 'search' });
    this.selectedCategories().forEach(id => {
      const cat = this.categories.find(c => c.id === id);
      if (cat) chips.push({ label: cat.name, type: 'category', value: id });
    });
    if (this.minRating() > 0) chips.push({ label: `${this.minRating()}+ stars`, type: 'rating' });
    if (this.inStockOnly()) chips.push({ label: 'In Stock Only', type: 'stock' });
    const [min, max] = this.priceRange();
    if (min > 0 || max < this.maxPrice)
      chips.push({ label: `৳${min.toLocaleString()} – ৳${max.toLocaleString()}`, type: 'price' });
    return chips;
  });

  activeCategoryLabel = computed(() => {
    const cats = this.selectedCategories();
    if (!cats.length) return 'All Products';
    if (cats.length === 1) return this.categories.find(c => c.id === cats[0])?.name ?? 'Products';
    return `${cats.length} Categories`;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const q = params.get('q');
    const category = params.get('category');
    if (q) this.searchQuery.set(q);
    if (category) this.selectedCategories.set([category]);
  }

  // ── Handlers ──────────────────────────────────────────────────────────
  onSearchChange() { this.currentPage.set(1); }

  onCategoryToggle(categoryId: string) {
    this.selectedCategories.update(cats =>
      cats.includes(categoryId) ? cats.filter(c => c !== categoryId) : [...cats, categoryId]
    );
    this.currentPage.set(1);
  }

  isCategorySelected(id: string): boolean {
    return this.selectedCategories().includes(id);
  }

  onPriceSliderChange(range: number | number[]) {
    const r = Array.isArray(range) ? range : [0, range];
    this.priceRange.set([r[0], r[1]]);
    this.priceSlider = [r[0], r[1]];
    this.currentPage.set(1);
  }

  onRatingSelect(rating: number) {
    this.minRating.set(this.minRating() === rating ? 0 : rating);
    this.currentPage.set(1);
  }

  onStockToggle(val: boolean) {
    this.inStockOnly.set(val);
    this.currentPage.set(1);
  }

  onSortChange() { this.currentPage.set(1); }

  onPageChange(page: number) {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  removeChip(chip: FilterChip) {
    switch (chip.type) {
      case 'search':   this.searchQuery.set(''); break;
      case 'category': this.selectedCategories.update(c => c.filter(v => v !== chip.value)); break;
      case 'rating':   this.minRating.set(0); break;
      case 'stock':    this.inStockOnly.set(false); break;
      case 'price':    this.priceRange.set([0, this.maxPrice]); this.priceSlider = [0, this.maxPrice]; break;
    }
    this.currentPage.set(1);
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedCategories.set([]);
    this.priceRange.set([0, this.maxPrice]);
    this.priceSlider = [0, this.maxPrice];
    this.minRating.set(0);
    this.inStockOnly.set(false);
    this.sortBy.set('default');
    this.currentPage.set(1);
  }

  onAddToCart(product: Product) {
    console.log('Add to cart:', product.name);
  }

  getPriceFormatter(value: number): string {
    return `৳${value.toLocaleString()}`;
  }
}
