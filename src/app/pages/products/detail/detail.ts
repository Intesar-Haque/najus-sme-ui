import { Component, inject, signal, computed, OnInit, DestroyRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap, map } from 'rxjs';

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
import { NzModalModule }     from 'ng-zorro-antd/modal';
import { NzFormModule }      from 'ng-zorro-antd/form';
import { NzInputModule }     from 'ng-zorro-antd/input';

import { ApiService }  from '../../../core/services/api.service';
import { CartService }  from '../../../core/services/cart.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ProductCard }  from '../../../shared/components/product-card/product-card';
import { Product, ProductReview, ProductVariant, Vendor } from '../../../core/models';

@Component({
  selector: 'app-product-detail',
  imports: [
    RouterLink, FormsModule, DecimalPipe, DatePipe,
    NzButtonModule, NzIconModule, NzTagModule, NzRateModule,
    NzBreadCrumbModule, NzEmptyModule, NzAvatarModule, NzToolTipModule,
    NzDividerModule, NzSpinModule, NzModalModule, NzFormModule, NzInputModule,
    ProductCard,
  ],
  templateUrl: './detail.html',
  styleUrl:    './detail.less',
})
export class ProductDetail implements OnInit {
  private api        = inject(ApiService);
  private cart       = inject(CartService);
  private favorites  = inject(FavoritesService);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private message    = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  product         = signal<Product | null>(null);
  vendor          = signal<Vendor | null>(null);
  relatedProducts = signal<Product[]>([]);
  notFound        = signal(false);
  loading         = signal(true);

  // Fix for QA bug #66 ("Not being able to rate any product") — see
  // SQA-FIX.md Fix #3.
  reviews          = signal<ProductReview[]>([]);
  reviewModalOpen  = signal(false);
  submittingReview = signal(false);
  reviewForm = { name: '', email: '', rating: 5, comment: '' };
  @ViewChild('reviewNgForm') reviewNgForm?: NgForm;

  // Gallery
  activeImageIndex = signal(0);
  activeImage = computed(() => {
    const p = this.product();
    if (!p) return '';
    return p.images[this.activeImageIndex()] ?? p.images[0];
  });

  // Quantity
  quantity = signal(1);

  // Fix for QA bug #60 ("no product variant selector"). See SQA-FIX.md
  // Fix #4 — vendors could always add colour variants with their own
  // price/stock, but the storefront never let a customer choose one: it
  // always sold at Product.price, which is just the MIN of the variants'
  // prices (see Product::syncPriceFromVariants on the backend), silently
  // undercharging and giving no way to pick a colour at all.
  selectedVariant = signal<ProductVariant | null>(null);

  // What the customer is actually looking at right now: the selected
  // variant's price/stock if the product has variants, else the product's
  // own — every price/stock display and addToCart() reads through this,
  // not p.price/p.inStock directly.
  displayPrice = computed<number>(() => {
    const p = this.product();
    return this.selectedVariant()?.price ?? p?.price ?? 0;
  });

  displayInStock = computed<boolean>(() => {
    const p = this.product();
    if (!p) return false;
    return p.variants?.length ? (this.selectedVariant()?.stock ?? 0) > 0 : p.inStock;
  });

  // Fix for QA bug #62 ("revisiting a product already in the cart should
  // tell the user it's already there") — see SQA-FIX.md Fix #22. Reactive:
  // recomputes whenever the cart or the selected variant changes, so
  // switching colour variants updates which line (if any) is "already in
  // your cart".
  cartQuantity = computed<number>(() => {
    const p = this.product();
    if (!p) return 0;
    return this.cart.quantityOf(p.id, this.selectedVariant()?.id ?? null);
  });

  private maxQuantity = computed<number>(() => {
    const v = this.selectedVariant();
    return v ? Math.max(v.stock, 0) : 99; // no per-unit stock tracked without a variant
  });

  // Discount
  discountPct = computed<number | null>(() => {
    const p = this.product();
    if (!p?.originalPrice) return null;
    return Math.round((1 - this.displayPrice() / p.originalPrice) * 100);
  });

  ngOnInit() {
    // Fix for QA bug #22 ("clicking a suggested product doesn't display the
    // new detail"). This used to read route.snapshot.paramMap once, here in
    // ngOnInit — but Angular reuses this component when navigating from one
    // /products/:id route to another (e.g. a related-product link), so
    // ngOnInit never re-ran and the page kept showing the previous product.
    // Subscribing to route.paramMap instead reacts to every id change,
    // including ones that don't recreate the component. See SQA-FIX.md.
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
      map(params => params.get('id')),
      switchMap(id => {
        if (!id) return of({
          id, product: null as Product | null, related: [] as Product[],
          vendor: null as Vendor | null, reviews: [] as ProductReview[],
        });
        this.loading.set(true);
        this.notFound.set(false);
        return this.api.getProductById(id).pipe(
          switchMap(product => {
            if (!product) return of({
              id, product: null as Product | null, related: [] as Product[],
              vendor: null as Vendor | null, reviews: [] as ProductReview[],
            });
            return forkJoin({
              related:  this.api.getRelatedProducts(id),
              vendor:   this.api.getVendorById(String(product.vendor.id)),
              reviews:  this.api.getProductReviews(id),
            }).pipe(
              switchMap(({ related, vendor, reviews }) => of({ id, product, related, vendor, reviews })),
            );
          }),
        );
      }),
    ).subscribe({
      next: ({ id, product, related, vendor, reviews }) => {
        if (!id || !product) {
          this.notFound.set(true);
        } else {
          this.product.set(product);
          this.relatedProducts.set(related);
          this.reviews.set(reviews);
          this.vendor.set(vendor ?? null);
          // Reset per-product UI state — otherwise a leftover gallery index
          // or quantity from the previous product would carry over into
          // this one now that the component instance is reused.
          this.activeImageIndex.set(0);
          this.quantity.set(1);
          // Default to the first in-stock variant (fix #60) — falls back to
          // the first variant at all if every one is sold out, so the price
          // shown still matches something real rather than defaulting to
          // Product.price (which is just the min of the variants anyway).
          const variants = product.variants ?? [];
          this.selectedVariant.set(
            variants.find(v => v.stock > 0) ?? variants[0] ?? null
          );
        }
        this.loading.set(false);
      },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  selectImage(index: number) {
    this.activeImageIndex.set(index);
  }

  // Fix for QA bug #60 ("no product variant selector"). See SQA-FIX.md
  // Fix #4.
  selectVariant(variant: ProductVariant) {
    if (variant.stock <= 0) return;
    this.selectedVariant.set(variant);
    this.quantity.set(1);
  }

  incrementQty() {
    this.quantity.update(q => Math.min(this.maxQuantity(), q + 1));
  }

  decrementQty() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  addToCart() {
    const p = this.product();
    if (!p || !this.displayInStock()) return;
    const variant = this.selectedVariant();
    // Fix for QA bug #62 — see SQA-FIX.md Fix #22.
    const { wasAlreadyInCart, newQuantity } = this.cart.add(p, this.quantity(), variant ?? undefined);
    const variantSuffix = variant ? ` (${variant.colorName})` : '';
    this.message.success(
      wasAlreadyInCart
        ? `${p.name}${variantSuffix} was already in your cart — now ×${newQuantity}`
        : `${p.name}${variantSuffix} added to cart (×${this.quantity()})`
    );
    // Fix for QA bug #61 — see SQA-FIX.md Fix #25. Dropped the
    // redirect-to-cart-on-first-add; the toast (plus the "Already in your
    // cart" pill above, from #62) is enough — the user stays on the
    // product page as asked.
  }

  // Fix for QA bug #67 ("Not being able to mark any product as
  // favourite"). See SQA-FIX.md Fix #3.
  get isFavorite(): boolean {
    const p = this.product();
    return p ? this.favorites.isFavorite(p.id) : false;
  }

  toggleFavorite() {
    const p = this.product();
    if (!p) return;
    const nowFavorite = this.favorites.toggle(p.id);
    this.message.success(nowFavorite ? `${p.name} added to favourites` : `${p.name} removed from favourites`);
  }

  // Fix for QA bug #66 ("Not being able to rate any product"). See
  // SQA-FIX.md Fix #3.
  openReviewModal() {
    this.reviewForm = { name: '', email: '', rating: 5, comment: '' };
    this.reviewModalOpen.set(true);
  }

  submitReview() {
    if (this.reviewNgForm?.invalid) {
      Object.values(this.reviewNgForm.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity(); });
      return;
    }

    const p = this.product();
    if (!p) return;

    this.submittingReview.set(true);
    this.api.submitProductReview(p.id, this.reviewForm).subscribe({
      next: res => {
        this.reviews.update(list => [res.data, ...list]);
        this.product.set({ ...p, rating: res.product.rating, reviewCount: res.product.reviewCount });
        this.submittingReview.set(false);
        this.reviewModalOpen.set(false);
        this.message.success('Thanks for your review!');
      },
      error: err => {
        this.submittingReview.set(false);
        this.message.error(err.error?.message ?? 'Failed to submit your review. Please try again.');
      },
    });
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}
