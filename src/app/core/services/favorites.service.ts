import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'favoriteProductIds';

/**
 * Fix for QA bug #67 ("Not being able to mark any product as favourite").
 * See SQA-FIX.md, Fix #3. Before this, the wishlist heart icon on the
 * product card only called preventDefault() to stop it from wrongly
 * opening the product detail page — it never actually favourited anything.
 *
 * The storefront has no customer login (only vendors log in, for the
 * dashboard), so there's no account to attach a server-side wishlist to.
 * Favourites are kept client-side in localStorage instead — persists
 * across visits on this device/browser, same trust level as the `lang`
 * preference already stored this way in navbar.ts.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private _ids = signal<Set<string>>(this.loadFromStorage());

  readonly ids   = computed(() => this._ids());
  readonly count = computed(() => this._ids().size);

  isFavorite(productId: string): boolean {
    return this._ids().has(productId);
  }

  toggle(productId: string): boolean {
    let nowFavorite = false;
    this._ids.update(ids => {
      const next = new Set(ids);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
        nowFavorite = true;
      }
      this.saveToStorage(next);
      return next;
    });
    return nowFavorite;
  }

  private loadFromStorage(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set(); // private-browsing / storage disabled — fail open to "no favourites"
    }
  }

  private saveToStorage(ids: Set<string>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // storage full/disabled — favouriting still works for this session, just won't persist
    }
  }
}
