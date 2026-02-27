import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';

import { NzButtonModule }      from 'ng-zorro-antd/button';
import { NzIconModule }        from 'ng-zorro-antd/icon';
import { NzFormModule }        from 'ng-zorro-antd/form';
import { NzInputModule }       from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule }      from 'ng-zorro-antd/select';
import { NzSwitchModule }      from 'ng-zorro-antd/switch';
import { NzSpinModule }        from 'ng-zorro-antd/spin';
import { NzMessageService }    from 'ng-zorro-antd/message';

import { ApiService } from '../../../core/services/api.service';
import { Category } from '../../../core/models';

@Component({
  selector: 'app-dash-product-create',
  imports: [
    RouterLink, ReactiveFormsModule,
    NzButtonModule, NzIconModule, NzFormModule, NzInputModule,
    NzInputNumberModule, NzSelectModule, NzSwitchModule, NzSpinModule,
  ],
  templateUrl: './product-create.html',
  styleUrl:    './product-create.less',
})
export class DashProductCreate implements OnInit {
  private api        = inject(ApiService);
  private router     = inject(Router);
  private fb         = inject(FormBuilder);
  private message    = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  categories   = signal<Category[]>([]);
  catLoading   = signal(true);
  saving       = signal(false);

  form: FormGroup = this.fb.group({
    name:           ['', [Validators.required, Validators.maxLength(200)]],
    description:    ['', Validators.required],
    price:          [null, [Validators.required, Validators.min(0)]],
    original_price: [null],
    category_id:    [null, Validators.required],
    tags_input:     [''],
    image_urls:     this.fb.array([this.fb.control('')]),
    in_stock:       [true],
    is_new:         [false],
  });

  get imageUrls(): FormArray { return this.form.get('image_urls') as FormArray; }

  ngOnInit() {
    this.api.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cats => { this.categories.set(cats); this.catLoading.set(false); },
        error: ()  => { this.catLoading.set(false); },
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

    const raw  = this.form.getRawValue();
    const tags = (raw.tags_input as string).split(',').map((t: string) => t.trim()).filter(Boolean);
    const image_urls = (raw.image_urls as string[]).filter(u => u?.trim());

    this.saving.set(true);
    this.api.createDashboardProduct({
      name:           raw.name,
      description:    raw.description,
      price:          raw.price,
      original_price: raw.original_price || null,
      category_id:    raw.category_id,
      tags,
      image_urls,
      in_stock:       raw.in_stock,
      is_new:         raw.is_new,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ data }) => {
        this.message.success(`"${data.name}" listed successfully!`);
        this.saving.set(false);
        this.router.navigate(['/dashboard/products']);
      },
      error: () => {
        this.message.error('Failed to create product. Please try again.');
        this.saving.set(false);
      },
    });
  }
}
