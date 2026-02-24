import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-product-card',
  imports: [
    RouterLink,
    NzCardModule, NzTagModule, NzRateModule, NzButtonModule,
    NzIconModule, NzAvatarModule, NzToolTipModule, FormsModule, DecimalPipe,
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.less',
})
export class ProductCard {
  product = input.required<Product>();
  addToCart = output<Product>();

  get discountPct(): number | null {
    const p = this.product();
    if (!p.originalPrice) return null;
    return Math.round((1 - p.price / p.originalPrice) * 100);
  }

  onAddToCart(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.addToCart.emit(this.product());
  }
}
