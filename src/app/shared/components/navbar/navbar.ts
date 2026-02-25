import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
    TranslateModule,
    NzButtonModule, NzIconModule, NzDropDownModule,
    NzMenuModule, NzBadgeModule, NzDrawerModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.less',
})
export class Navbar {
  private translate = inject(TranslateService);

  lang = signal<'en' | 'bn'>(
    (localStorage.getItem('lang') as 'en' | 'bn') ?? 'en'
  );
  scrolled = signal(false);
  mobileOpen = signal(false);

  navLinks = [
    { label: 'nav.products',   path: '/products',   icon: 'shopping' },
    { label: 'nav.businesses', path: '/businesses',  icon: 'shop' },
    { label: 'nav.events',     path: '/events',      icon: 'calendar' },
    { label: 'nav.blog',       path: '/blog',        icon: 'read' },
  ];

  constructor() {
    // Translation bootstrap (addLangs / setDefaultLang / initial use())
    // is handled by APP_INITIALIZER in app.config.ts.
    // Only apply the body class for the persisted language.
    document.body.classList.add(`lang-${this.lang()}`);
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  switchLang(lang: 'en' | 'bn') {
    this.lang.set(lang);
    this.applyLang(lang);
  }

  private applyLang(lang: 'en' | 'bn') {
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
    document.body.classList.remove('lang-en', 'lang-bn');
    document.body.classList.add(`lang-${lang}`);
  }
}
