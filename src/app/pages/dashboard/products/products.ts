import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule }   from 'ng-zorro-antd/icon';
import { NzTagModule }    from 'ng-zorro-antd/tag';
import { NzSpinModule }   from 'ng-zorro-antd/spin';
import { NzEmptyModule }  from 'ng-zorro-antd/empty';

import { ApiService } from '../../../core/services/api.service';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-dash-products',
  imports: [
    RouterLink, DecimalPipe,
    NzButtonModule, NzIconModule, NzTagModule, NzSpinModule, NzEmptyModule,
  ],
  templateUrl: './products.html',
  styleUrl:    './products.less',
})
export class DashProducts implements OnInit {
  private api        = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  loading  = signal(true);
  products = signal<Product[]>([]);

  ngOnInit() {
    this.api.getDashboardProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: p  => { this.products.set(p); this.loading.set(false); },
        error: () => { this.loading.set(false); },
      });
  }
}
