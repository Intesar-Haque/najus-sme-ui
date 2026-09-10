import { Injectable, computed, effect, signal } from '@angular/core';
import { CartItem, Product, ProductVariant } from '../models';

// A product with two different colour variants in the cart are two
// different purchases (different price/stock) — QA bug #60 ("no variant
// selector"), see SQA-FIX.md Fix #4. Matching on product id alone would
// silently merge them into one line and lose the variant choice.
function lineKey(productId: string, variantId?: string | null): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive filter, not a "still exists in the catalog" check — this
    // only guards against corrupted/malformed localStorage content, so a
    // bad save from an older app version can't crash the cart on load.
    return parsed.filter((item): item is CartItem =>
      !!item && typeof item === 'object' &&
      !!item.product && typeof item.product.id === 'string' &&
      typeof item.quantity === 'number' && item.quantity > 0
    );
  } catch {
    // Corrupted JSON, or storage disabled/unavailable (some browsers throw
    // here in private-browsing mode) — start with an empty cart instead of
    // crashing the app on load.
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or disabled — cart still works in-memory for this
    // session, it just won't survive a reload. Not worth surfacing.
  }
}

// Fix for LAUNCH-GAPS.md #12 ("cart doesn't survive navigation") — see
// SQA-FIX.md Fix #35. The cart previously lived only in an in-memory signal,
// so a full page reload (typing /cart directly, refreshing, opening a
// shared link) wiped it with nothing to blame — the app just restarted with
// an empty variable. Persisting to localStorage under this key lets the
// cart survive a reload; it's still per-browser/per-device only, which is
// expected for a guest cart with no account attached to it.
const STORAGE_KEY = 'najus_cart_v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>(loadCart());

  readonly items    = this._items.asReadonly();
  readonly count    = computed(() => this._items().reduce((s, i) => s + i.quantity, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((s, i) => s + this.unitPrice(i) * i.quantity, 0)
  );

  constructor() {
    effect(() => saveCart(this._items()));
  }

  unitPrice(item: CartItem): number {
    return item.variant?.price ?? item.product.price;
  }

  /**
   * Fix for QA bug #62 ("revisiting a product already in the cart should
   * tell the user it's already there") — see SQA-FIX.md Fix #22. This used
   * to silently increment quantity with no way for a caller to tell "this
   * was already in the cart" apart from "this was a fresh add" — both
   * looked identical from the outside. Now returns which one happened (plus
   * the line's new total quantity) so callers can show the right message.
   */
  add(product: Product, qty = 1, variant?: ProductVariant): { wasAlreadyInCart: boolean; newQuantity: number } {
    const key = lineKey(product.id, variant?.id);
    const existing = this._items().find(i => lineKey(i.product.id, i.variant?.id) === key);
    const wasAlreadyInCart = !!existing;
    const newQuantity = (existing?.quantity ?? 0) + qty;

    this._items.update(items => {
      const idx = items.findIndex(i => lineKey(i.product.id, i.variant?.id) === key);
      if (idx >= 0) {
        return items.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...items, { product, quantity: qty, variant }];
    });

    return { wasAlreadyInCart, newQuantity };
  }

  /** Current quantity of this exact product/variant line, or 0 if absent. */
  quantityOf(productId: string, variantId?: string | null): number {
    const key = lineKey(productId, variantId);
    return this._items().find(i => lineKey(i.product.id, i.variant?.id) === key)?.quantity ?? 0;
  }

  remove(productId: string, variantId?: string | null): void {
    const key = lineKey(productId, variantId);
    this._items.update(items => items.filter(i => lineKey(i.product.id, i.variant?.id) !== key));
  }

  setQuantity(productId: string, qty: number, variantId?: string | null): void {
    if (qty < 1) { this.remove(productId, variantId); return; }
    const key = lineKey(productId, variantId);
    this._items.update(items =>
      items.map(i => lineKey(i.product.id, i.variant?.id) === key ? { ...i, quantity: qty } : i)
    );
  }

  clear(): void {
    this._items.set([]);
  }
}
