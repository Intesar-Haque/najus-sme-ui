import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NzButtonModule }     from 'ng-zorro-antd/button';
import { NzIconModule }       from 'ng-zorro-antd/icon';
import { NzTagModule }        from 'ng-zorro-antd/tag';
import { NzSpinModule }       from 'ng-zorro-antd/spin';
import { NzEmptyModule }      from 'ng-zorro-antd/empty';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzToolTipModule }    from 'ng-zorro-antd/tooltip';
import { NzMessageService }   from 'ng-zorro-antd/message';
import { NzModalService }     from 'ng-zorro-antd/modal';

import { ApiService, Order, OrderStatus, OrdersResponse } from '../../../core/services/api.service';

type StatusFilter = 'all' | OrderStatus;

// Orders whose status is one of these can still be cancelled. Fix for
// SQA_REPORT.md B-04 — see DashboardController::cancelOrder(). Once an
// order is delivered or already cancelled, there's nothing left to cancel.
const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'processing'];

@Component({
  selector: 'app-dash-orders',
  imports: [
    DatePipe, DecimalPipe, TitleCasePipe,
    NzButtonModule, NzIconModule, NzTagModule,
    NzSpinModule, NzEmptyModule, NzPaginationModule, NzToolTipModule,
  ],
  providers: [NzModalService],
  templateUrl: './orders.html',
  styleUrl:    './orders.less',
})
export class DashOrders implements OnInit {
  private api        = inject(ApiService);
  private message    = inject(NzMessageService);
  private modal       = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  loading       = signal(true);
  response      = signal<OrdersResponse>({
    data: [],
    meta: { currentPage: 1, lastPage: 1, total: 0, perPage: 20 },
  });
  statusFilter  = signal<StatusFilter>('all');
  expandedIds   = signal<Set<string>>(new Set());
  cancellingId  = signal<string | null>(null);

  readonly statusTabs: { label: string; value: StatusFilter }[] = [
    { label: 'All',        value: 'all'       },
    { label: 'Pending',    value: 'pending'    },
    { label: 'Processing', value: 'processing' },
    { label: 'Delivered',  value: 'delivered'  },
    { label: 'Cancelled',  value: 'cancelled'  },
  ];

  orders   = computed(() => this.response().data);
  meta     = computed(() => this.response().meta);

  ngOnInit() {
    this.load();
  }

  load(page = 1) {
    this.loading.set(true);
    const f = this.statusFilter();
    const status = f === 'all' ? undefined : f as OrderStatus;
    this.api.getOrders({ status, page, per_page: 20 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r  => { this.response.set(r); this.loading.set(false); },
        error: () => { this.loading.set(false); },
      });
  }

  setFilter(f: StatusFilter) {
    this.statusFilter.set(f);
    this.load(1);
  }

  toggleExpand(id: string) {
    this.expandedIds.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  statusColor(s: OrderStatus): string {
    return ({ pending: 'orange', processing: 'blue', delivered: 'green', cancelled: 'red' })[s] ?? 'default';
  }

  canCancel(order: Order): boolean {
    return CANCELLABLE_STATUSES.includes(order.status);
  }

  cancel(order: Order, event: Event) {
    event.stopPropagation(); // don't also toggle the card's expand/collapse
    this.modal.confirm({
      nzTitle:   `Cancel order #${order.id}?`,
      nzContent: 'The customer will need to be informed separately. Any reserved stock for this order will be returned.',
      nzOkText:  'Cancel order',
      nzOkDanger: true,
      nzCancelText: 'Keep order',
      nzOnOk:    () => this.doCancel(order),
    });
  }

  private doCancel(order: Order) {
    this.cancellingId.set(order.id);
    this.api.cancelOrder(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.response.update(r => ({
            ...r,
            data: r.data.map(o => o.id === order.id ? data : o),
          }));
          this.cancellingId.set(null);
          this.message.success(`Order #${order.id} cancelled.`);
        },
        error: (err) => {
          this.cancellingId.set(null);
          this.message.error(err.error?.message ?? 'Failed to cancel order. Please try again.');
        },
      });
  }

  /** Extract contact number from notes string */
  contactFrom(notes: string | null): string {
    if (!notes) return '—';
    const m = notes.match(/Contact:\s*([^,]+)/);
    return m ? m[1].trim() : '—';
  }

  /** Extract address from notes string */
  addressFrom(notes: string | null): string {
    if (!notes) return '—';
    const m = notes.match(/Address:\s*([^,]+(?:,[^,]+)*?)(?=,\s*Postal)/);
    return m ? m[1].trim() : '—';
  }

  /** Extract zone from notes string */
  zoneFrom(notes: string | null): string {
    if (!notes) return '—';
    const m = notes.match(/Zone:\s*([^,]+)/);
    return m ? m[1].trim() : '—';
  }

  /** Filter out the shipping line item for display */
  productItems(order: Order) {
    return order.items.filter(i => !i.productName.startsWith('Shipping'));
  }

  shippingItem(order: Order) {
    return order.items.find(i => i.productName.startsWith('Shipping'));
  }
}
