import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';
import { NzButtonModule }      from 'ng-zorro-antd/button';
import { NzIconModule }        from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule }     from 'ng-zorro-antd/divider';
import { NzMessageService }    from 'ng-zorro-antd/message';
import { NzModalModule }       from 'ng-zorro-antd/modal';
import { NzFormModule }        from 'ng-zorro-antd/form';
import { NzInputModule }       from 'ng-zorro-antd/input';
import { NzRadioModule }       from 'ng-zorro-antd/radio';
import { NzTagModule }         from 'ng-zorro-antd/tag';

import { CartService } from '../../core/services/cart.service';
import { ApiService }  from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

const SHIPPING_INSIDE  = 60;
const SHIPPING_OUTSIDE = 120;

@Component({
  selector: 'app-cart',
  imports: [
    RouterLink, DecimalPipe, FormsModule, ReactiveFormsModule,
    NzButtonModule, NzIconModule, NzInputNumberModule,
    NzDividerModule, NzModalModule, NzFormModule, NzInputModule,
    NzRadioModule, NzTagModule,
  ],
  templateUrl: './cart.html',
  styleUrl: './cart.less',
})
export class Cart {
  readonly cart   = inject(CartService);
  private api     = inject(ApiService);
  private message = inject(NzMessageService);
  private auth    = inject(AuthService);
  private fb      = inject(FormBuilder);

  checkoutVisible = signal(false);
  submitting      = signal(false);
  orderId         = signal<string | null>(null);

  member = this.auth.currentMember;

  checkoutForm = this.fb.group({
    customer_name:    ['', [Validators.required, Validators.maxLength(255)]],
    customer_email:   ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    contact_number:   ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,20}$/)]],
    delivery_address: ['', [Validators.required, Validators.maxLength(500)]],
    postal_code:      ['', [Validators.required, Validators.maxLength(20)]],
    delivery_zone:    ['inside', Validators.required],
    notes:            [''],
  });

  private zone$ = this.checkoutForm.get('delivery_zone')!.valueChanges.pipe(startWith('inside'));
  private deliveryZone = toSignal(this.zone$, { initialValue: 'inside' });

  shippingCost = computed(() =>
    this.deliveryZone() === 'outside' ? SHIPPING_OUTSIDE : SHIPPING_INSIDE
  );

  orderTotal = computed(() => this.cart.subtotal() + this.shippingCost());

  ngOnInit() {
    const m = this.member();
    if (m) {
      this.checkoutForm.patchValue({ customer_name: m.name, customer_email: m.email });
    }
  }

  openCheckout() {
    this.checkoutVisible.set(true);
  }

  submitOrder() {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const v = this.checkoutForm.value;

    // Price and vendor are resolved server-side from product_id — the
    // client no longer sends a price or a free-text product name (fix #64,
    // see SQA-FIX.md; this closes the ৳0-order hole tracked as B-02).
    // variant_id carries the chosen colour/variant through to checkout
    // (fix #60, SQA-FIX.md Fix #4) so the right price/stock is charged.
    const items = this.cart.items().map(i => ({
      product_id: i.product.id,
      variant_id: i.variant?.id,
      quantity:   i.quantity,
    }));

    this.submitting.set(true);
    this.api.placeOrder({
      customer_name:     v.customer_name!,
      customer_email:    v.customer_email!,
      customer_phone:    v.contact_number!,
      delivery_address:  v.delivery_address!,
      postal_code:       v.postal_code!,
      delivery_zone:     v.delivery_zone === 'outside' ? 'outside' : 'inside',
      notes:             v.notes || undefined,
      items,
    }).subscribe({
      next: res => {
        this.orderId.set(res.id);
        this.cart.clear();
        this.checkoutVisible.set(false);
        this.submitting.set(false);
        this.message.success(`Order #${res.id} placed! Total: ৳${res.total.toLocaleString()}`);
      },
      error: err => {
        this.submitting.set(false);
        this.message.error(err.message ?? 'Order failed. Please try again.');
      },
    });
  }
}
