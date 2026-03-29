import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Product } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([]);

  readonly items    = this._items.asReadonly();
  readonly count    = computed(() => this._items().reduce((s, i) => s + i.quantity, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((s, i) => s + i.product.price * i.quantity, 0)
  );

  add(product: Product, qty = 1): void {
    this._items.update(items => {
      const idx = items.findIndex(i => i.product.id === product.id);
      if (idx >= 0) {
        return items.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...items, { product, quantity: qty }];
    });
  }

  remove(productId: string): void {
    this._items.update(items => items.filter(i => i.product.id !== productId));
  }

  setQuantity(productId: string, qty: number): void {
    if (qty < 1) { this.remove(productId); return; }
    this._items.update(items =>
      items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i)
    );
  }

  clear(): void {
    this._items.set([]);
  }
}
