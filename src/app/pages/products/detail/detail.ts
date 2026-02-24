import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzButtonModule }    from 'ng-zorro-antd/button';
import { NzIconModule }      from 'ng-zorro-antd/icon';
import { NzTagModule }       from 'ng-zorro-antd/tag';
import { NzRateModule }      from 'ng-zorro-antd/rate';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzEmptyModule }     from 'ng-zorro-antd/empty';
import { NzAvatarModule }    from 'ng-zorro-antd/avatar';
import { NzToolTipModule }   from 'ng-zorro-antd/tooltip';
import { NzDividerModule }   from 'ng-zorro-antd/divider';
import { NzMessageService }  from 'ng-zorro-antd/message';

import { DataService } from '../../../core/services/data.service';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Product, Vendor } from '../../../core/models';

@Component({
  selector: 'app-product-detail',
  imports: [
    RouterLink, FormsModule, DecimalPipe,
    NzButtonModule, NzIconModule, NzTagModule, NzRateModule,
    NzBreadCrumbModule, NzEmptyModule, NzAvatarModule, NzToolTipModule,
    NzDividerModule,
    ProductCard,
  ],
  templateUrl: './detail.html',
  styleUrl:    './detail.less',
})
export class ProductDetail implements OnInit {
  private data    = inject(DataService);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private message = inject(NzMessageService);

  product        = signal<Product | null>(null);
  vendor         = signal<Vendor | null>(null);
  relatedProducts = signal<Product[]>([]);
  notFound       = signal(false);

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
    if (!id) { this.notFound.set(true); return; }

    const product = this.data.getProductById(id);
    if (!product) { this.notFound.set(true); return; }

    this.product.set(product);
    this.relatedProducts.set(this.data.getRelatedProducts(id, product.categoryId));

    const vendor = this.data.getVendorById(product.vendor.id);
    if (vendor) this.vendor.set(vendor);
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
