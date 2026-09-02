import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSpinModule }    from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { VendorCard } from '../../shared/components/vendor-card/vendor-card';
import { Product, SiteStats } from '../../core/models';

const EMPTY_STATS: SiteStats = {
  members: 0, products: 0, categories: 0, events: 0, districts: 0, yearsActive: 0,
};

@Component({
  selector: 'app-landing',
  imports: [
    RouterLink, FormsModule, TranslateModule,
    NzButtonModule, NzIconModule, NzInputModule, NzTagModule,
    NzCardModule, NzStatisticModule, NzDividerModule, NzAvatarModule, NzBadgeModule,
    NzSpinModule,
    ProductCard, VendorCard, DecimalPipe, DatePipe,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.less',
})
export class Landing {
  private api     = inject(ApiService);
  private auth    = inject(AuthService);
  private cart    = inject(CartService);
  private router  = inject(Router);
  private message = inject(NzMessageService);

  isAuthenticated = this.auth.isAuthenticated;

  // ── Data from API ────────────────────────────────────────────────────
  readonly stats      = toSignal(this.api.getStats(),              { initialValue: EMPTY_STATS });
  readonly categories = toSignal(this.api.getCategories(),         { initialValue: [] });
  readonly products   = toSignal(this.api.getFeaturedProducts(8),  { initialValue: [] });
  readonly vendors    = toSignal(this.api.getFeaturedVendors(4),   { initialValue: [] });
  readonly events     = toSignal(this.api.getFeaturedEvents(3),    { initialValue: [] });
  readonly posts      = toSignal(this.api.getFeaturedBlogPosts(3), { initialValue: [] });

  readonly popular = [
    'Jamdani Saree', 'Organic Tea', 'Nakshi Kantha', 'Mustard Oil', 'Handicrafts',
  ];

  // ── State ────────────────────────────────────────────────────────────
  searchQuery = '';
  activeCategory = signal('');

  // ── Handlers ─────────────────────────────────────────────────────────
  onSearch() {
    const q = this.searchQuery.trim();
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
    // Fix for QA bug #62 — see SQA-FIX.md Fix #22.
    const { wasAlreadyInCart } = this.cart.add(product);
    this.message.success(
      wasAlreadyInCart ? `${product.name} is already in your cart — quantity updated` : `${product.name} added to cart`
    );
    // Fix for QA bug #61 ("adding to cart shouldn't redirect — user should
    // stay on the current page") — see SQA-FIX.md Fix #25. Previously
    // redirected to /cart on the first add of a session; the toast above
    // is enough confirmation, and the cart badge in the header updates
    // live from the same signal.
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
