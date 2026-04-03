import {
  Component, inject, signal, computed, OnInit, AfterViewInit,
  DestroyRef, ViewChild, ElementRef,
} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { NzButtonModule }      from 'ng-zorro-antd/button';
import { NzIconModule }        from 'ng-zorro-antd/icon';
import { NzFormModule }        from 'ng-zorro-antd/form';
import { NzInputModule }       from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule }      from 'ng-zorro-antd/select';
import { NzCascaderModule }    from 'ng-zorro-antd/cascader';
import { NzSwitchModule }      from 'ng-zorro-antd/switch';
import { NzSpinModule }        from 'ng-zorro-antd/spin';
import { NzTagModule }         from 'ng-zorro-antd/tag';
import { NzCardModule }        from 'ng-zorro-antd/card';
import { NzAlertModule }       from 'ng-zorro-antd/alert';
import { NzProgressModule }    from 'ng-zorro-antd/progress';
import { NzToolTipModule }     from 'ng-zorro-antd/tooltip';
import { NzMessageService }    from 'ng-zorro-antd/message';
import { NzModalService }      from 'ng-zorro-antd/modal';

import { ApiService }        from '../../../core/services/api.service';
import { Category, Product } from '../../../core/models';

interface ScoreCriterion {
  label: string;
  points: number;
  earned: number;
  tip: string;
}

const RESETS_TO_UNDER_QA = new Set(['live', 'under_qa', 'out_of_stock', 'inactive']);

const STATUS_LABELS: Record<string, string> = {
  draft:         'Draft',
  under_qa:      'Under Review',
  live:          'Live',
  out_of_stock:  'Out of Stock',
  inactive:      'Inactive',
  deleted:       'Deleted',
};

@Component({
  selector: 'app-dash-product-edit',
  imports: [
    RouterLink, ReactiveFormsModule, DecimalPipe,
    NzButtonModule, NzIconModule, NzFormModule, NzInputModule,
    NzInputNumberModule, NzSelectModule, NzCascaderModule, NzSwitchModule, NzSpinModule,
    NzTagModule, NzCardModule, NzAlertModule, NzProgressModule, NzToolTipModule,
  ],
  providers: [NzModalService],
  templateUrl: './product-edit.html',
  styleUrl:    './product-edit.less',
})
export class DashProductEdit implements OnInit, AfterViewInit {
  private api        = inject(ApiService);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private fb         = inject(FormBuilder);
  private message    = inject(NzMessageService);
  private modal      = inject(NzModalService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('descRte')       descRteEl!:       ElementRef<HTMLDivElement>;
  @ViewChild('highlightsRte') highlightsRteEl!: ElementRef<HTMLDivElement>;

  loading    = signal(true);
  saving     = signal(false);
  deleting   = signal(false);
  submitting = signal(false);
  restoring  = signal(false);
  product    = signal<Product | null>(null);
  categories      = signal<Category[]>([]);
  catLoading      = signal(true);
  categoryOptions = computed(() => this.categories().map(c => this.toCatOption(c)));

  // RTE state
  descEmpty = signal(true);
  hlEmpty   = signal(true);

  // Image state
  existingImages   = signal<string[]>([]);
  newImageFiles    = signal<File[]>([]);
  newImagePreviews = signal<string[]>([]);

  firstPreviewImage = computed(() =>
    this.newImagePreviews()[0] ?? this.existingImages()[0] ?? null
  );

  // Status helpers
  isDraft            = computed(() => this.product()?.status === 'draft');
  isDeleted          = computed(() => this.product()?.status === 'deleted');
  willResetToUnderQa = computed(() => RESETS_TO_UNDER_QA.has(this.product()?.status ?? ''));
  statusLabel        = computed(() =>
    STATUS_LABELS[this.product()?.status ?? ''] ?? (this.product()?.status ?? '')
  );

  // Video state
  existingVideoUrl = signal<string | null>(null);
  videoMode        = signal<'url' | 'file'>('url');
  videoFile        = signal<File | null>(null);
  removeVideo      = signal(false);

  readonly warrantyTypes = [
    { label: 'No Warranty',     value: 'no_warranty' },
    { label: 'Brand Warranty',  value: 'brand_warranty' },
    { label: 'Seller Warranty', value: 'seller_warranty' },
  ];

  private productId = '';

  form: FormGroup = this.fb.group({
    name:               ['', [Validators.required, Validators.maxLength(200)]],
    description:        ['', Validators.required],
    category_path:      [[]],
    category_id:        [null, Validators.required],
    original_price:     [null],
    tags_input:         [''],
    is_new:             [false],
    video_url:          [''],
    highlights:         [''],
    whats_in_box:       [''],
    weight:             [null],
    dimensions:         [''],
    contains_liquid:    [false],
    contains_flammable: [false],
    warranty_type:      ['no_warranty'],
    warranty_policy:    [''],
    return_policy:      [''],
    variants: this.fb.array([]),
  });

  private formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  // ─── Content Score ──────────────────────────────────────────────────────────
  scoreItems = computed((): ScoreCriterion[] => {
    const raw      = this.formValues();
    const imgCount = this.existingImages().length + this.newImageFiles().length;
    const descText = ((raw.description as string) || '').replace(/<[^>]*>/g, '').trim();
    const hlText   = ((raw.highlights   as string) || '').replace(/<[^>]*>/g, '').trim();
    const variants = (raw.variants as any[] || []);
    const hasPrice = variants.some((v: any) => v.price != null && Number(v.price) > 0);

    return [
      {
        label: 'Product Name', points: 15,
        earned: (raw.name?.trim() ? 10 : 0) + ((raw.name?.trim()?.length ?? 0) >= 10 ? 5 : 0),
        tip: 'A clear, descriptive name of 10+ characters improves discoverability',
      },
      {
        label: 'Category', points: 10,
        earned: raw.category_id ? 10 : 0,
        tip: 'Selecting a category helps buyers find your product',
      },
      {
        label: 'Description', points: 20,
        earned: (descText ? 10 : 0) + (descText.length >= 80 ? 10 : 0),
        tip: 'Write a detailed description (80+ characters) to build buyer trust',
      },
      {
        label: 'Product Images', points: 20,
        earned: (imgCount > 0 ? 10 : 0) + (imgCount >= 3 ? 10 : 0),
        tip: 'Upload at least 3 images to maximise buyer confidence',
      },
      {
        label: 'Price & Variants', points: 15,
        earned: hasPrice ? 15 : 0,
        tip: 'Set a price for at least one colour variant',
      },
      {
        label: 'Highlights', points: 10,
        earned: hlText ? 10 : 0,
        tip: 'Add key selling points to help buyers decide faster',
      },
      {
        label: 'Tags', points: 5,
        earned: raw.tags_input?.trim() ? 5 : 0,
        tip: 'Tags improve search ranking and discoverability',
      },
      {
        label: 'Warranty Info', points: 5,
        earned: raw.warranty_type && raw.warranty_type !== 'no_warranty' ? 5 : 0,
        tip: 'Providing warranty information increases buyer confidence',
      },
    ];
  });

  totalScore = computed(() => this.scoreItems().reduce((s, i) => s + i.earned, 0));

  scoreColor = computed(() => {
    const s = this.totalScore();
    if (s >= 81) return '#28a745';
    if (s >= 61) return '#1890ff';
    if (s >= 41) return '#fa8c16';
    return '#ff4d4f';
  });

  scoreLabel = computed(() => {
    const s = this.totalScore();
    if (s >= 81) return 'Excellent';
    if (s >= 61) return 'Good';
    if (s >= 41) return 'Fair';
    return 'Needs Work';
  });

  readonly scoreFormat = (pct: number): string => `${pct}`;

  get variants(): FormArray { return this.form.get('variants') as FormArray; }
  variantGroup(i: number): FormGroup { return this.variants.at(i) as FormGroup; }

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id') ?? '';

    this.form.get('category_path')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((path: string[]) => {
        this.form.get('category_id')!.setValue(path?.[path.length - 1] ?? null, { emitEvent: false });
      });

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

  ngAfterViewInit() {
    // RTEs are inside @else if (product()), so they may not exist yet.
    // We populate them in patchForm once product loads instead.
  }

  execRteCmd(event: MouseEvent, command: string, value?: string) {
    event.preventDefault();
    document.execCommand(command, false, value);
  }

  onRteInput(field: 'description' | 'highlights', event: Event) {
    const el   = event.target as HTMLElement;
    const text = el.textContent?.trim() ?? '';
    let   html = el.innerHTML;
    if (html === '<br>') html = '';
    if (field === 'description') this.descEmpty.set(!text);
    else                         this.hlEmpty.set(!text);
    this.form.get(field)!.setValue(html, { emitEvent: true });
  }

  private toCatOption(cat: Category): { value: string; label: string; isLeaf: boolean; children?: any[] } {
    const leaf = !cat.children?.length;
    return {
      value: cat.id,
      label: cat.icon ? `${cat.icon} ${cat.name}` : cat.name,
      isLeaf: leaf,
      children: leaf ? undefined : cat.children!.map(c => this.toCatOption(c)),
    };
  }

  private findCategoryPath(id: string, cats: Category[]): string[] | null {
    for (const cat of cats) {
      if (cat.id === id) return [cat.id];
      if (cat.children?.length) {
        const sub = this.findCategoryPath(id, cat.children);
        if (sub) return [cat.id, ...sub];
      }
    }
    return null;
  }

  private patchForm(p: Product) {
    this.existingImages.set(p.images ?? []);
    this.existingVideoUrl.set(p.videoUrl ?? null);
    if (p.videoUrl) this.form.patchValue({ video_url: p.videoUrl });

    while (this.variants.length > 0) this.variants.removeAt(0);
    if (p.variants?.length) {
      p.variants.forEach(v => {
        this.variants.push(this.fb.group({
          color_name: [v.colorName, Validators.required],
          color_hex:  [v.colorHex ?? '#4caf50'],
          price:      [v.price,  [Validators.required, Validators.min(0)]],
          stock:      [v.stock,  [Validators.required, Validators.min(0)]],
        }));
      });
    } else {
      this.addVariant();
    }

    const path = this.findCategoryPath(p.categoryId, this.categories());

    this.form.patchValue({
      ...(path ? { category_path: path } : {}),
      name:               p.name,
      description:        p.description,
      category_id:        p.categoryId,
      original_price:     p.originalPrice ?? null,
      tags_input:         p.tags?.join(', ') ?? '',
      is_new:             p.isNew,
      highlights:         p.highlights ?? '',
      whats_in_box:       p.whatsInBox ?? '',
      weight:             p.weight ?? null,
      dimensions:         p.dimensions ?? '',
      contains_liquid:    p.containsLiquid ?? false,
      contains_flammable: p.containsFlammable ?? false,
      warranty_type:      p.warrantyType ?? 'no_warranty',
      warranty_policy:    p.warrantyPolicy ?? '',
      return_policy:      p.returnPolicy ?? '',
    });

    // Populate RTEs after Angular renders them (they're inside @if)
    setTimeout(() => {
      if (this.descRteEl?.nativeElement) {
        const v = this.form.get('description')!.value;
        if (v) { this.descRteEl.nativeElement.innerHTML = v; this.descEmpty.set(false); }
      }
      if (this.highlightsRteEl?.nativeElement) {
        const v = this.form.get('highlights')!.value;
        if (v) { this.highlightsRteEl.nativeElement.innerHTML = v; this.hlEmpty.set(false); }
      }
    });
  }

  addVariant() {
    this.variants.push(this.fb.group({
      color_name: ['', Validators.required],
      color_hex:  ['#4caf50'],
      price:      [null, [Validators.required, Validators.min(0)]],
      stock:      [0,    [Validators.required, Validators.min(0)]],
    }));
  }

  removeVariant(i: number) {
    if (this.variants.length > 1) this.variants.removeAt(i);
  }

  onNewImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const combined = [...this.newImageFiles(), ...Array.from(input.files)].slice(0, 8);
    this.newImagePreviews().forEach(p => URL.revokeObjectURL(p));
    this.newImageFiles.set(combined);
    this.newImagePreviews.set(combined.map(f => URL.createObjectURL(f)));
    input.value = '';
  }

  removeNewImage(i: number) {
    const files    = [...this.newImageFiles()];
    const previews = [...this.newImagePreviews()];
    URL.revokeObjectURL(previews[i]);
    files.splice(i, 1);
    previews.splice(i, 1);
    this.newImageFiles.set(files);
    this.newImagePreviews.set(previews);
  }

  onVideoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.videoFile.set(input.files[0]);
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.updateDashboardProduct(this.productId, this.buildFormData())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.product.set(data);
          this.existingImages.set(data.images ?? []);
          this.existingVideoUrl.set(data.videoUrl ?? null);
          this.newImageFiles.set([]);
          this.newImagePreviews.set([]);
          this.removeVideo.set(false);
          this.message.success(`"${data.name}" updated successfully!`);
          this.saving.set(false);
        },
        error: () => {
          this.message.error('Failed to update product. Please try again.');
          this.saving.set(false);
        },
      });
  }

  submitForReview() {
    this.modal.confirm({
      nzTitle:   'Submit for Review?',
      nzContent: 'The NAJUS team will review your product before it goes live. This cannot be undone.',
      nzOkText:  'Submit',
      nzOnOk:    () => this.doSubmitForReview(),
    });
  }

  private doSubmitForReview() {
    this.submitting.set(true);
    this.api.submitDashboardProductForReview(this.productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.product.set(data);
          this.message.success('Product submitted for review.');
          this.submitting.set(false);
        },
        error: () => {
          this.message.error('Failed to submit product for review.');
          this.submitting.set(false);
        },
      });
  }

  confirmDelete() {
    this.modal.confirm({
      nzTitle:    'Delete this product?',
      nzContent:  `"${this.product()?.name}" will be removed. You can restore it later.`,
      nzOkText:   'Delete',
      nzOkDanger: true,
      nzOnOk:     () => this.deleteProduct(),
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

  confirmRestore() {
    this.modal.confirm({
      nzTitle:   'Restore this product?',
      nzContent: 'The product will be moved back to Draft status.',
      nzOkText:  'Restore',
      nzOnOk:    () => this.doRestore(),
    });
  }

  private doRestore() {
    this.restoring.set(true);
    this.api.restoreDashboardProduct(this.productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ data }) => {
          this.product.set(data);
          this.message.success('Product restored to draft.');
          this.restoring.set(false);
        },
        error: () => {
          this.message.error('Failed to restore product.');
          this.restoring.set(false);
        },
      });
  }

  private buildFormData(): FormData {
    const raw = this.form.getRawValue();
    const fd  = new FormData();

    fd.append('name',        raw.name);
    fd.append('description', raw.description);
    fd.append('category_id', raw.category_id);
    if (raw.original_price != null) fd.append('original_price', String(raw.original_price));

    const tags = (raw.tags_input as string).split(',').map((t: string) => t.trim()).filter(Boolean);
    tags.forEach(t => fd.append('tags[]', t));

    fd.append('is_new', raw.is_new ? '1' : '0');

    if (this.removeVideo()) {
      fd.append('remove_video', '1');
    } else if (this.videoMode() === 'url' && raw.video_url?.trim()) {
      fd.append('video_url', raw.video_url.trim());
    } else if (this.videoMode() === 'file' && this.videoFile()) {
      fd.append('video', this.videoFile()!);
    }

    if (raw.highlights?.trim())    fd.append('highlights',    raw.highlights.trim());
    if (raw.whats_in_box?.trim())  fd.append('whats_in_box',  raw.whats_in_box.trim());
    if (raw.weight != null)        fd.append('weight',        String(raw.weight));
    if (raw.dimensions?.trim())    fd.append('dimensions',    raw.dimensions.trim());

    fd.append('contains_liquid',    raw.contains_liquid    ? '1' : '0');
    fd.append('contains_flammable', raw.contains_flammable ? '1' : '0');
    fd.append('warranty_type', raw.warranty_type);
    if (raw.warranty_policy?.trim()) fd.append('warranty_policy', raw.warranty_policy.trim());
    if (raw.return_policy?.trim())   fd.append('return_policy',   raw.return_policy.trim());

    this.newImageFiles().forEach(f => fd.append('images[]', f));

    (raw.variants as any[]).forEach((v, i) => {
      fd.append(`variants[${i}][color_name]`, v.color_name);
      if (v.color_hex) fd.append(`variants[${i}][color_hex]`, v.color_hex);
      fd.append(`variants[${i}][price]`, String(v.price));
      fd.append(`variants[${i}][stock]`, String(v.stock ?? 0));
    });

    return fd;
  }
}
