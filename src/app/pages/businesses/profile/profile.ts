import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap } from 'rxjs';

import { NzButtonModule }    from 'ng-zorro-antd/button';
import { NzIconModule }      from 'ng-zorro-antd/icon';
import { NzTagModule }       from 'ng-zorro-antd/tag';
import { NzTabsModule }      from 'ng-zorro-antd/tabs';
import { NzRateModule }      from 'ng-zorro-antd/rate';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzEmptyModule }     from 'ng-zorro-antd/empty';
import { NzAvatarModule }    from 'ng-zorro-antd/avatar';
import { NzToolTipModule }   from 'ng-zorro-antd/tooltip';
import { NzSpinModule }      from 'ng-zorro-antd/spin';
import { FormsModule }       from '@angular/forms';

import { ApiService } from '../../../core/services/api.service';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Vendor, Product } from '../../../core/models';

@Component({
  selector: 'app-profile',
  imports: [
    RouterLink, FormsModule, DecimalPipe,
    NzButtonModule, NzIconModule, NzTagModule, NzTabsModule, NzRateModule,
    NzBreadCrumbModule, NzEmptyModule, NzAvatarModule, NzToolTipModule,
    NzSpinModule, ProductCard,
  ],
  templateUrl: './profile.html',
  styleUrl:    './profile.less',
})
export class Profile implements OnInit {
  private api        = inject(ApiService);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private destroyRef = inject(DestroyRef);

  vendor   = signal<Vendor | null>(null);
  products = signal<Product[]>([]);
  notFound = signal(false);
  loading  = signal(true);

  vendorRating = computed(() => this.vendor()?.rating ?? 0);
  activeTab    = signal(0);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); this.loading.set(false); return; }

    this.api.getVendorById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(vendor => {
        if (!vendor) return of({ vendor: null as Vendor | null, products: [] as Product[] });
        return forkJoin({
          products: this.api.getVendorProducts(id),
        }).pipe(
          switchMap(({ products }) => of({ vendor, products })),
        );
      }),
    ).subscribe({
      next: ({ vendor, products }) => {
        if (!vendor) {
          this.notFound.set(true);
        } else {
          this.vendor.set(vendor);
          this.products.set(products);
        }
        this.loading.set(false);
      },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  goBack() {
    this.router.navigate(['/businesses']);
  }
}
