import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzToolTipModule }  from 'ng-zorro-antd/tooltip';
import { NzSpinModule }     from 'ng-zorro-antd/spin';
import { NzEmptyModule }    from 'ng-zorro-antd/empty';

import { ApiService, DashboardAnalytics } from '../../../core/services/api.service';

@Component({
  selector: 'app-dash-analytics',
  imports: [DecimalPipe, NzProgressModule, NzToolTipModule, NzSpinModule, NzEmptyModule],
  templateUrl: './analytics.html',
  styleUrl:    './analytics.less',
})
export class DashAnalytics implements OnInit {
  private api        = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);

  private analyticsData = signal<DashboardAnalytics>({
    monthly_revenue: [],
    top_products: [],
    summary: {
      orders_this_month: 0, orders_last_month: 0,
      avg_order_value: 0,   avg_order_value_last: 0,
      pending_orders: 0,
      cancellation_rate: 0, cancellation_rate_last: 0,
    },
  });

  monthlyRevenue     = computed(() => this.analyticsData().monthly_revenue);
  maxRevenue         = computed(() => Math.max(...this.monthlyRevenue().map(m => m.revenue), 1));
  productPerformance = computed(() => this.analyticsData().top_products);

  private summary = computed(() => this.analyticsData().summary);

  ordersThisMonth  = computed(() => this.summary().orders_this_month);
  ordersTrend      = computed(() => this.pctChange(this.summary().orders_last_month, this.summary().orders_this_month));
  avgOrderValue    = computed(() => this.summary().avg_order_value);
  avgOrderTrend    = computed(() => this.pctChange(this.summary().avg_order_value_last, this.summary().avg_order_value));
  pendingOrders    = computed(() => this.summary().pending_orders);
  cancellationRate = computed(() => this.summary().cancellation_rate);
  cancelTrend      = computed(() => this.pctChange(this.summary().cancellation_rate_last, this.summary().cancellation_rate));

  ngOnInit() {
    this.api.getDashboardAnalytics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => { this.analyticsData.set(data); this.loading.set(false); },
        error: ()  => { this.loading.set(false); },
      });
  }

  barHeight(revenue: number): number {
    return Math.round((revenue / this.maxRevenue()) * 100);
  }

  private pctChange(prev: number, curr: number): number {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }
}
