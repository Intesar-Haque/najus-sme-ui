import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { NzButtonModule }      from 'ng-zorro-antd/button';
import { NzIconModule }        from 'ng-zorro-antd/icon';
import { NzFormModule }        from 'ng-zorro-antd/form';
import { NzInputModule }       from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule }      from 'ng-zorro-antd/select';
import { NzSwitchModule }      from 'ng-zorro-antd/switch';
import { NzSpinModule }        from 'ng-zorro-antd/spin';
import { NzTagModule }         from 'ng-zorro-antd/tag';
import { NzCardModule }        from 'ng-zorro-antd/card';
import { NzMessageService }    from 'ng-zorro-antd/message';
import { NzModalService }      from 'ng-zorro-antd/modal';

import { ApiService }  from '../../../core/services/api.service';
import { Category, Product } from '../../../core/models';

@Component({
  selector: 'app-dash-product-edit',
  imports: [
    RouterLink, ReactiveFormsModule, DecimalPipe,
    NzButtonModule, NzIconModule, NzFormModule, NzInputModule,
    NzInputNumberModule, NzSelectModule, NzSwitchModule, NzSpinModule,
    NzTagModule, NzCardModule,
  ],
  providers: [
    NzModalService
  ],
  templateUrl: './product-edit.html',
  styleUrl:    './product-edit.less',
})
export class DashProductEdit implements OnInit {
  private api        = inject(ApiService);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private fb         = inject(FormBuilder);
  private message    = inject(NzMessageService);
  private modal      = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  loading    = signal(true);
  saving     = signal(false);
  deleting   = signal(false);
  product    = signal<Product | null>(null);
  categories = signal<Category[]>([]);
  catLoading = signal(true);

  private productId = '';

  form: FormGroup = this.fb.group({
    name:           ['', [Validators.required, Validators.maxLength(200)]],
    description:    ['', Validators.required],
    price:          [null, [Validators.required, Validators.min(0)]],
    original_price: [null],
    category_slug:  [null, Validators.required],
    tags_input:     [''],
    image_urls:     this.fb.array([this.fb.control('')]),
    in_stock:       [true],
    is_new:         [false],
  });

  get imageUrls(): FormArray { return this.form.get('image_urls') as FormArray; }

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id') ?? '';

    forkJoin({
      categories: this.api.getCategories(),
      product:    this.api.getDashboardProductById(this.productId),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ categories, product }) => {
        this.categories.set(categories);
        this.catLoading.set(false);
        if (product) {
          this.product.set(product);
          this.patchForm(product);
        } else {
          this.message.error('Product not found.');
          this.router.navigate(['/dashboard/products']);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.message.error('Failed to load product.');
        this.router.navigate(['/dashboard/products']);
      },
    });
  }

  private patchForm(p: Product) {
    while (this.imageUrls.length > 0) this.imageUrls.removeAt(0);
    const imgs = p.images?.length ? p.images : [''];
    imgs.forEach(url => this.imageUrls.push(this.fb.control(url)));

    this.form.patchValue({
      name:           p.name,
      description:    p.description,
      price:          p.price,
      original_price: p.originalPrice ?? null,
      category_slug:  p.categoryId,
      tags_input:     p.tags?.join(', ') ?? '',
      in_stock:       p.inStock,
      is_new:         p.isNew,
    });
  }

  addImageUrl() {
    if (this.imageUrls.length < 5) this.imageUrls.push(this.fb.control(''));
  }

  removeImageUrl(i: number) {
    if (this.imageUrls.length > 1) this.imageUrls.removeAt(i);
  }

  submit() {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsDirty());
      return;
    }
    const raw        = this.form.getRawValue();
    const tags       = (raw.tags_input as string).split(',').map((t: string) => t.trim()).filter(Boolean);
    const image_urls = (raw.image_urls as string[]).filter(u => u?.trim());

    this.saving.set(true);
    this.api.updateDashboardProduct(this.productId, {
      name:           raw.name,
      description:    raw.description,
      price:          raw.price,
      original_price: raw.original_price || null,
      category_slug:  raw.category_slug,
      tags,
      image_urls,
      in_stock:       raw.in_stock,
      is_new:         raw.is_new,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ data }) => {
        this.product.set(data);
        this.message.success(`"${data.name}" updated successfully!`);
        this.saving.set(false);
      },
      error: () => {
        this.message.error('Failed to update product. Please try again.');
        this.saving.set(false);
      },
    });
  }

  confirmDelete() {
    this.modal.confirm({
      nzTitle:   'Delete this product?',
      nzContent: `"${this.product()?.name}" will be permanently removed from your store.`,
      nzOkText:  'Delete',
      nzOkDanger: true,
      nzOnOk:    () => this.deleteProduct(),
    });
  }

  private deleteProduct() {
    this.deleting.set(true);
    this.api.deleteDashboardProduct(this.productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.message.success('Product deleted.');
          this.router.navigate(['/dashboard/products']);
        },
        error: () => {
          this.message.error('Failed to delete product.');
          this.deleting.set(false);
        },
      });
  }
}
