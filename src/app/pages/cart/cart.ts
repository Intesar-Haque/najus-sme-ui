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

    const v        = this.checkoutForm.value;
    const isOutside = v.delivery_zone === 'outside';
    const zone      = isOutside ? 'Outside Dhaka' : 'Inside Dhaka';
    const shipping  = isOutside ? SHIPPING_OUTSIDE : SHIPPING_INSIDE;

    const deliveryNote =
      `Address: ${v.delivery_address}, Postal: ${v.postal_code}, ` +
      `Contact: ${v.contact_number}, Zone: ${zone}, Shipping: ৳${shipping}, ` +
      `Payment: Cash on Delivery` +
      (v.notes ? ` | Note: ${v.notes}` : '');

    const items = [
      ...this.cart.items().map(i => ({
        product_name: i.product.name,
        quantity:     i.quantity,
        unit_price:   i.product.price,
      })),
      { product_name: `Shipping (${zone})`, quantity: 1, unit_price: shipping },
    ];

    this.submitting.set(true);
    this.api.placeOrder({
      customer_name:  v.customer_name!,
      customer_email: v.customer_email!,
      notes:          deliveryNote,
      source:         'web',
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
