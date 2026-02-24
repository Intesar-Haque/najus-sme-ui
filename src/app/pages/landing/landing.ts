import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

import { DataService } from '../../core/services/data.service';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { VendorCard } from '../../shared/components/vendor-card/vendor-card';
import { Product } from '../../core/models';

@Component({
  selector: 'app-landing',
  imports: [
    RouterLink, FormsModule, TranslateModule,
    NzButtonModule, NzIconModule, NzInputModule, NzTagModule,
    NzCardModule, NzStatisticModule, NzDividerModule, NzAvatarModule, NzBadgeModule,
    ProductCard, VendorCard, DecimalPipe, DatePipe,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.less',
})
export class Landing {
  private data   = inject(DataService);
  private router = inject(Router);

  // ── Data ─────────────────────────────────────────────────────────────
  readonly stats      = this.data.stats;
  readonly categories = this.data.categories;
  readonly products   = this.data.getFeaturedProducts(8);
  readonly vendors    = this.data.getFeaturedVendors(4);
  readonly events     = this.data.getFeaturedEvents(3);
  readonly posts      = this.data.getFeaturedBlogPosts(3);
  readonly popular    = this.data.popularSearches;

  // ── State ────────────────────────────────────────────────────────────
  searchQuery = signal('');
  activeCategory = signal('');

  // ── Handlers ─────────────────────────────────────────────────────────
  onSearch() {
    const q = this.searchQuery().trim();
    if (q) this.router.navigate(['/products'], { queryParams: { q } });
  }

  onPopularSearch(term: string) {
    this.router.navigate(['/products'], { queryParams: { q: term } });
  }

  onCategoryClick(categoryId: string) {
    this.activeCategory.set(categoryId);
    this.router.navigate(['/products'], { queryParams: { category: categoryId } });
  }

  onAddToCart(product: Product) {
    // cart logic
    console.log('Add to cart:', product.name);
  }

  getEventTypeColor(type: string): string {
    const map: Record<string, string> = {
      'trade-fair':  'gold',
      'workshop':    'green',
      'exhibition':  'blue',
      'webinar':     'purple',
      'networking':  'cyan',
    };
    return map[type] ?? 'default';
  }

  formatEventType(type: string): string {
    return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
