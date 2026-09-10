import { Component, inject, signal, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink, RouterLinkActive,
    FormsModule,
    TranslateModule,
    NzButtonModule, NzIconModule, NzDropDownModule,
    NzMenuModule, NzBadgeModule, NzDrawerModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.less',
})
export class Navbar {
  private auth      = inject(AuthService);
  private cart      = inject(CartService);
  private router    = inject(Router);

  isAuthenticated = this.auth.isAuthenticated;
  cartCount       = this.cart.count;

  scrolled = signal(false);
  mobileOpen = signal(false);
  mobileSearchOpen = signal(false);

  navLinks = [
    { label: 'nav.products',   path: '/products',   icon: 'shopping' },
    { label: 'nav.businesses', path: '/businesses',  icon: 'shop' },
    { label: 'nav.events',     path: '/events',      icon: 'calendar' },
    { label: 'nav.blog',       path: '/blog',        icon: 'read' },
  ];

  // Translation bootstrap (addLangs / setDefaultLang / initial use()) is
  // handled by APP_INITIALIZER in app.config.ts — English-only, see
  // LAUNCH-GAPS.md #1. The language switcher itself was dropped for good
  // (there's nothing in this template to toggle it), not just hidden.

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  // Fix — there was no search anywhere except the /products page's own
  // filter sidebar, so a visitor browsing from the homepage (or anywhere
  // else) had no way to search at all without first navigating to
  // Products manually. This is deliberately a simple "jump box" — it
  // doesn't try to two-way-sync with that page's own `searchQuery` state,
  // it just lands there with `?q=` already set, which products.ts already
  // reads on init (see its ngOnInit query-param handling).
  search(term: string) {
    const q = term.trim();
    this.router.navigate(['/products'], q ? { queryParams: { q } } : {});
    this.mobileSearchOpen.set(false);
  }
}
