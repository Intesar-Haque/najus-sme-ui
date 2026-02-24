import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { NzButtonModule }    from 'ng-zorro-antd/button';
import { NzIconModule }      from 'ng-zorro-antd/icon';
import { NzTagModule }       from 'ng-zorro-antd/tag';
import { NzTabsModule }      from 'ng-zorro-antd/tabs';
import { NzRateModule }      from 'ng-zorro-antd/rate';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzEmptyModule }     from 'ng-zorro-antd/empty';
import { NzAvatarModule }    from 'ng-zorro-antd/avatar';
import { NzToolTipModule }   from 'ng-zorro-antd/tooltip';
import { FormsModule }       from '@angular/forms';

import { DataService } from '../../../core/services/data.service';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Vendor, Product } from '../../../core/models';

@Component({
  selector: 'app-profile',
  imports: [
    RouterLink, FormsModule, DecimalPipe,
    NzButtonModule, NzIconModule, NzTagModule, NzTabsModule, NzRateModule,
    NzBreadCrumbModule, NzEmptyModule, NzAvatarModule, NzToolTipModule,
    ProductCard,
  ],
  templateUrl: './profile.html',
  styleUrl:    './profile.less',
})
export class Profile implements OnInit {
  private data   = inject(DataService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  vendor   = signal<Vendor | null>(null);
  products = signal<Product[]>([]);
  notFound = signal(false);

  // Rating as plain value for nz-rate
  vendorRating = computed(() => this.vendor()?.rating ?? 0);

  activeTab = signal(0);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); return; }

    const v = this.data.getVendorById(id);
    if (!v) { this.notFound.set(true); return; }

    this.vendor.set(v);
    this.products.set(this.data.getProductsByVendor(id));
  }

  goBack() {
    this.router.navigate(['/businesses']);
  }
}
