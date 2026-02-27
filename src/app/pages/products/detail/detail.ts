import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap } from 'rxjs';

import { NzButtonModule }    from 'ng-zorro-antd/button';
import { NzIconModule }      from 'ng-zorro-antd/icon';
import { NzTagModule }       from 'ng-zorro-antd/tag';
import { NzRateModule }      from 'ng-zorro-antd/rate';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzEmptyModule }     from 'ng-zorro-antd/empty';
import { NzAvatarModule }    from 'ng-zorro-antd/avatar';
import { NzToolTipModule }   from 'ng-zorro-antd/tooltip';
import { NzDividerModule }   from 'ng-zorro-antd/divider';
import { NzSpinModule }      from 'ng-zorro-antd/spin';
import { NzMessageService }  from 'ng-zorro-antd/message';

import { ApiService } from '../../../core/services/api.service';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Product, Vendor } from '../../../core/models';

@Component({
  selector: 'app-product-detail',
  imports: [
    RouterLink, FormsModule, DecimalPipe,
    NzButtonModule, NzIconModule, NzTagModule, NzRateModule,
    NzBreadCrumbModule, NzEmptyModule, NzAvatarModule, NzToolTipModule,
    NzDividerModule, NzSpinModule,
    ProductCard,
  ],
  templateUrl: './detail.html',
  styleUrl:    './detail.less',
})
export class ProductDetail implements OnInit {
  private api        = inject(ApiService);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private message    = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  product         = signal<Product | null>(null);
  vendor          = signal<Vendor | null>(null);
  relatedProducts = signal<Product[]>([]);
  notFound        = signal(false);
  loading         = signal(true);

  // Gallery
  activeImageIndex = signal(0);
  activeImage = computed(() => {
    const p = this.product();
    if (!p) return '';
    return p.images[this.activeImageIndex()] ?? p.images[0];
  });

  // Quantity
  quantity = signal(1);

  // Discount
  discountPct = computed<number | null>(() => {
    const p = this.product();
    if (!p?.originalPrice) return null;
    return Math.round((1 - p.price / p.originalPrice) * 100);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); this.loading.set(false); return; }

    this.api.getProductById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(product => {
        if (!product) return of({ product: null as Product | null, related: [] as Product[], vendor: null as Vendor | null });
        return forkJoin({
          related: this.api.getRelatedProducts(id),
          vendor:  this.api.getVendorById(String(product.vendor.id)),
        }).pipe(
          switchMap(({ related, vendor }) => of({ product, related, vendor })),
        );
      }),
    ).subscribe({
      next: ({ product, related, vendor }) => {
        if (!product) {
          this.notFound.set(true);
        } else {
          this.product.set(product);
          this.relatedProducts.set(related);
          if (vendor) this.vendor.set(vendor);
        }
        this.loading.set(false);
      },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  selectImage(index: number) {
    this.activeImageIndex.set(index);
  }

  incrementQty() {
    this.quantity.update(q => q + 1);
  }

  decrementQty() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  addToCart() {
    const p = this.product();
    if (!p) return;
    this.message.success(`${p.name} added to cart (×${this.quantity()})`);
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}
