import { Component, inject, signal, computed, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';

import { NzButtonModule }   from 'ng-zorro-antd/button';
import { NzIconModule }     from 'ng-zorro-antd/icon';
import { NzTagModule }      from 'ng-zorro-antd/tag';
import { NzAvatarModule }   from 'ng-zorro-antd/avatar';
import { NzBadgeModule }    from 'ng-zorro-antd/badge';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzDividerModule }  from 'ng-zorro-antd/divider';
import { NzDrawerModule }   from 'ng-zorro-antd/drawer';
import { NzToolTipModule }  from 'ng-zorro-antd/tooltip';
import { NzEmptyModule }    from 'ng-zorro-antd/empty';

import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { EventType }   from '../../core/models';

export type Section = 'overview' | 'products' | 'analytics' | 'events' | 'settings';

export interface DashOrder {
  id:       string;
  product:  string;
  customer: string;
  amount:   number;
  date:     string;
  status:   'delivered' | 'processing' | 'pending' | 'cancelled';
}

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink, DatePipe, DecimalPipe,
    NzButtonModule, NzIconModule, NzTagModule, NzAvatarModule,
    NzBadgeModule, NzProgressModule, NzDividerModule,
    NzDrawerModule, NzToolTipModule, NzEmptyModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.less',
})
export class Dashboard {
  private auth   = inject(AuthService);
  private data   = inject(DataService);
  private router = inject(Router);

  member        = this.auth.currentMember;
  activeSection = signal<Section>('overview');
  drawerOpen    = signal(false);

  readonly allEvents = this.data.events;

  readonly today = new Date();

  readonly greeting = computed(() => {
    const h = this.today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  });

  vendor = computed(() => {
    const m = this.member();
    return m ? this.data.getVendorById(m.vendorId) : null;
  });

  myProducts = computed(() => {
    const m = this.member();
    return m ? this.data.getProductsByVendor(m.vendorId) : [];
  });

  kpis = computed(() => {
    const v = this.vendor();
    return [
      { icon: 'shopping',     label: 'Products Listed',  value: this.myProducts().length, prefix: '',    suffix: '',   color: '#1976d2', bg: '#e3f2fd' },
      { icon: 'rise',         label: 'Monthly Revenue',  value: 28600,                    prefix: 'BDT ',suffix: '',   color: '#28a745', bg: '#e8f5e9' },
      { icon: 'file-done',    label: 'Total Orders',     value: 47,                       prefix: '',    suffix: '',   color: '#ff7a00', bg: '#fff3e6' },
      { icon: 'star',         label: 'Store Rating',     value: v?.rating ?? 0,           prefix: '',    suffix: '/5', color: '#f59f00', bg: '#fff8e1' },
    ];
  });

  readonly orders: DashOrder[] = [
    { id: 'ORD-2501', product: 'Jamdani Saree — Heritage Weave',      customer: 'Ayesha Rahman',  amount: 4500, date: '2025-01-20', status: 'delivered'  },
    { id: 'ORD-2502', product: 'Shital Pati Woven Mat',                customer: 'Mehedi Hasan',   amount: 950,  date: '2025-01-18', status: 'delivered'  },
    { id: 'ORD-2503', product: 'Bamboo Basket Collection (Set of 3)',  customer: 'Sultana Begum',  amount: 750,  date: '2025-01-22', status: 'processing' },
    { id: 'ORD-2504', product: 'Nakshi Kantha — Embroidered Quilt',    customer: 'Karim Ali',      amount: 2800, date: '2025-01-23', status: 'pending'    },
    { id: 'ORD-2505', product: 'Bamboo Desk Organiser Set',            customer: 'Fatima Noor',    amount: 620,  date: '2025-01-24', status: 'pending'    },
  ];

  readonly monthlyRevenue = [
    { month: 'Aug', revenue: 18500 },
    { month: 'Sep', revenue: 22300 },
    { month: 'Oct', revenue: 19800 },
    { month: 'Nov', revenue: 31200 },
    { month: 'Dec', revenue: 38900 },
    { month: 'Jan', revenue: 28600 },
  ];
  readonly maxRevenue = Math.max(...this.monthlyRevenue.map(m => m.revenue));

  productPerformance = computed(() => {
    const products = this.myProducts();
    if (!products.length) return [];
    const maxR = Math.max(...products.map(p => p.reviewCount), 1);
    return [...products]
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 5)
      .map(p => ({
        name:    p.name,
        reviews: p.reviewCount,
        rating:  p.rating,
        pct:     Math.round((p.reviewCount / maxR) * 100),
      }));
  });

  readonly navItems: { id: Section; icon: string; label: string }[] = [
    { id: 'overview',  icon: 'dashboard',  label: 'Overview'    },
    { id: 'products',  icon: 'shopping',   label: 'My Products' },
    { id: 'analytics', icon: 'bar-chart',  label: 'Analytics'   },
    { id: 'events',    icon: 'calendar',   label: 'Events'      },
    { id: 'settings',  icon: 'setting',    label: 'Settings'    },
  ];

  constructor() {
    // Guard: redirect to login if session is lost
    effect(() => {
      if (!this.auth.isAuthenticated()) {
        this.router.navigate(['/login']);
      }
    });
  }

  navigate(section: Section) {
    this.activeSection.set(section);
    this.drawerOpen.set(false);
  }

  statusColor(status: DashOrder['status']): 'success' | 'processing' | 'warning' | 'error' {
    const map = { delivered: 'success', processing: 'processing', pending: 'warning', cancelled: 'error' } as const;
    return map[status];
  }

  statusLabel(status: DashOrder['status']): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  typeColor(type: EventType): string {
    const map: Record<EventType, string> = {
      'trade-fair': 'orange', 'workshop': 'blue', 'exhibition': 'purple',
      'webinar': 'cyan', 'networking': 'green',
    };
    return map[type] ?? 'default';
  }

  barHeight(revenue: number): number {
    return Math.round((revenue / this.maxRevenue) * 100);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
