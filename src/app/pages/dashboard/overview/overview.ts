import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule }   from 'ng-zorro-antd/icon';
import { NzTagModule }    from 'ng-zorro-antd/tag';
import { NzBadgeModule }  from 'ng-zorro-antd/badge';
import { NzToolTipModule }from 'ng-zorro-antd/tooltip';
import { NzSpinModule }   from 'ng-zorro-antd/spin';
import { NzEmptyModule }  from 'ng-zorro-antd/empty';

import { AuthService } from '../../../core/services/auth.service';
import { ApiService, DashboardOverview, DashApiOrder } from '../../../core/services/api.service';
import { EventType, SmeEvent, Vendor } from '../../../core/models';

export interface DashOrder {
  id: string; product: string; customer: string;
  amount: number; date: string;
  status: 'delivered' | 'processing' | 'pending' | 'cancelled';
}

@Component({
  selector: 'app-dash-overview',
  imports: [
    RouterLink, DatePipe, DecimalPipe,
    NzButtonModule, NzIconModule, NzTagModule, NzBadgeModule,
    NzToolTipModule, NzSpinModule, NzEmptyModule,
  ],
  templateUrl: './overview.html',
  styleUrl:    './overview.less',
})
export class DashOverview implements OnInit {
  private api        = inject(ApiService);
  private auth       = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  loading    = signal(true);

  private overviewData = signal<DashboardOverview | null>(null);
  private rawOrders    = signal<DashApiOrder[]>([]);
  dashEvents           = signal<SmeEvent[]>([]);

  vendor = computed<Vendor | null>(() => this.overviewData()?.vendor ?? null);

  kpis = computed(() => [
    { icon: 'shopping',  label: 'Products Listed', value: this.overviewData()?.product_count   ?? 0, prefix: '',     suffix: '',   color: '#1976d2', bg: '#e3f2fd' },
    { icon: 'rise',      label: 'Monthly Revenue', value: this.overviewData()?.monthly_revenue ?? 0, prefix: 'BDT ', suffix: '',   color: '#28a745', bg: '#e8f5e9' },
    { icon: 'file-done', label: 'Total Orders',    value: this.overviewData()?.total_orders    ?? 0, prefix: '',     suffix: '',   color: '#ff7a00', bg: '#fff3e6' },
    { icon: 'star',      label: 'Store Rating',    value: this.vendor()?.rating                ?? 0, prefix: '',     suffix: '/5', color: '#f59f00', bg: '#fff8e1' },
  ]);

  dashOrders = computed<DashOrder[]>(() =>
    this.rawOrders().map(o => ({
      id: String(o.id), product: o.product_name, customer: o.customer_name,
      amount: o.amount, date: o.order_date, status: o.status,
    }))
  );

  ngOnInit() {
    forkJoin({
      overview: this.api.getDashboardOverview(),
      orders:   this.api.getDashboardOrders(),
      events:   this.api.getDashboardEvents(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ overview, orders, events }) => {
        this.overviewData.set(overview);
        this.rawOrders.set(orders);
        this.dashEvents.set(events);
        if (overview?.member) this.auth.currentMember.set(overview.member);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  statusColor(s: DashOrder['status']): 'success' | 'processing' | 'warning' | 'error' {
    return ({ delivered: 'success', processing: 'processing', pending: 'warning', cancelled: 'error' } as const)[s];
  }

  statusLabel(s: DashOrder['status']): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  typeColor(type: EventType): string {
    const map: Record<EventType, string> = {
      'trade-fair': 'orange', 'workshop': 'blue', 'exhibition': 'purple',
      'webinar': 'cyan', 'networking': 'green',
    };
    return map[type] ?? 'default';
  }
}
